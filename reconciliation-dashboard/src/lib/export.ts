

export function downloadCSV(
    headers: string[],
    rows: (string | number)[][],
    filename: string
) {
    const csvRows = rows.map(row => 
        row.map(cell => 
            (typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell))
            .join(',')
    )

    const csvString = [headers.join(','), ...csvRows].join('\n')

    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}