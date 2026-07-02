import { Company } from '@/schemas';
import { downloadCSV } from '@/lib/export';
import { useMonthlySummary } from '@/hooks/useDashboard';

interface SummaryBoardProps {
  companies: Company[];
  year: number;
  month: number;
}

export function SummaryBoard({ companies, year, month }: SummaryBoardProps) {
    const { data: rpcSummary = [] } = useMonthlySummary(year, month)
    
    const summaryData = companies.map(company => {
        const rpcRow = rpcSummary.find(r => r.company_id === company.id)
        
        const expectedAmount = rpcRow?.expected_amount || 0
        const actualAmount = rpcRow?.actual_amount || 0
        const difference = actualAmount - expectedAmount;

        return {
            companyName: company.name, 
            taxId: company.tax_id,
            expected: expectedAmount,
            actual: actualAmount,
            difference: difference,
        }
    }).filter(row => row.expected > 0 || row.actual > 0) // Only include companies with expected or actual amounts

    summaryData.sort((a, b) => b.expected - a.expected);

    const handleExportCSV = () => {
        const headers = ['Company Name', 'Tax ID', 'Expected (GEL)', 'Actual (GEL)', 'Difference (GEL)'];
    
        const rows = summaryData.map(row => [
            row.companyName,
            row.taxId,
            row.expected,
            row.actual,
            row.difference
        ])

        const paddedMonth = String(month).padStart(2, '0');
        downloadCSV(headers, rows, `reconciliation_summary_${year}_${paddedMonth}.csv`);
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="font-semibold text-slate-800">Expected vs. Actual Summary</h2>
        
            {/* CSV EXPORT BUTTON */}
            <button 
                onClick={handleExportCSV}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export CSV
            </button>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-3 font-medium">Company</th>
                        <th className="px-4 py-3 font-medium text-right">Expected (GEL)</th>
                        <th className="px-4 py-3 font-medium text-right">Actual (GEL)</th>
                        <th className="px-4 py-3 font-medium text-right">Difference</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {summaryData.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                No active contracts or payments for this month.
                            </td>
                        </tr>
                    ): (
                        summaryData.map((row) => {
                            let statusColor = "";
                            if (row.expected === 0 && row.actual > 0) {
                                statusColor = "text-amber-600 font-bold"; // Anomaly: Paid without active contract
                            } else if (row.actual === 0) {
                                statusColor = "text-slate-500"; // Hasn't paid anything yet
                            } else if (row.difference >= 0) {
                                statusColor = "text-emerald-600 font-medium"; // Met or exceeded expectations
                            } else {
                                statusColor = "text-rose-600 font-medium"; // Partial payment (fell short)
                            }

                            return (
                            <tr key={row.taxId} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-slate-900">{row.companyName}</div>
                                    <div className="text-xs text-slate-500">S/N: {row.taxId}</div>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                                    {row.expected > 0 ? row.expected.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                                    {row.actual > 0 ? row.actual.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                <td className={`px-4 py-3 text-right tabular-nums ${statusColor}`}>
                                    {row.difference > 0 ? '+' : ''}{row.difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
        </div>
    );
}