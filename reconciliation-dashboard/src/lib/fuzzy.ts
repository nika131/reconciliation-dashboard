import { Company } from '@/schemas';

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
    }
  }
  return matrix[a.length][b.length]
}

function getSimilarityScore(a: string, b: string): number {
  const longerLength = Math.max(a.length, b.length);
  if (longerLength === 0) return 1.0;
  return (longerLength - levenshteinDistance(a, b)) / longerLength;
}

export function suggestCompany(senderName: string | null, companies: Company[]): Company | null {
  if (!senderName) return null;

  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .replace(/შპს|სს|შ\.პ\.ს\.|ი\/მ|სსიპ|ა\(ა\)იპ/g, '')
      .replace(/ფილიალი/g, '')
      .replace(/[\(\)\.,-]/g, '')
      .replace(/\s+/g, '') 
      .trim()
  }

  const normalizedSender = normalize(senderName)
  if (!normalizedSender) return null

  let bestMatch: Company | null = null
  let highestScore = 0
  const SIMILARITY_THRESHOLD = 0.60

  for (const company of companies) {
    const normalizedCompany = normalize(company.name)
    
    let score = 0;

    if (normalizedCompany.includes(normalizedSender) || normalizedSender.includes(normalizedCompany)) {
        score = 1.0
    } else {
        score = getSimilarityScore(normalizedSender, normalizedCompany)
    }
    
    if (score > highestScore && score >= SIMILARITY_THRESHOLD) {
      highestScore = score
      bestMatch = company
    }
  }

  return bestMatch
}