
export async function runAutoMatching(): Promise<number> {
  const res = await fetch('/api/match', { method: 'POST' })
  const json = await res.json()
  
  if (!res.ok) throw new Error(json.error)
  return json.matched as number
}

export async function updateTransactionStatus(
  id: string, 
  status: 'matched' | 'unmatched' | 'ignored', 
  companyId?: string
): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(status === 'matched' ? { status, companyId } : { status }),
  })
  
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json.error)
  }
}