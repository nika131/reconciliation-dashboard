import { Company, Contract, Transaction } from '@/schemas';
import { isContractActiveInMonth } from '@/lib/calculations';

interface SummaryBoardProps {
  companies: Company[];
  contracts: Contract[];
  transactions: Transaction[];
  year: number;
  month: number;
}

export function SummaryBoard({ companies, contracts, transactions, year, month }: SummaryBoardProps) {
  const summaryData = companies.map(company => {
    const activeContracts = contracts.filter(c => 
      c.company_id === company.id && isContractActiveInMonth(c, year, month)
    );
    
    const expectedAmount = activeContracts.reduce((sum, c) => sum + c.monthly_amount, 0);

    const companyTransactions = transactions.filter(t => 
      t.matched_company_id === company.id && t.status === 'matched'
    );
    
    const actualAmount = companyTransactions.reduce((sum, t) => sum + t.amount, 0);

    const difference = actualAmount - expectedAmount;

    return {
      companyName: company.name,
      taxId: company.tax_id,
      expected: expectedAmount,
      actual: actualAmount,
      difference: difference,
    };
  });

  summaryData.sort((a, b) => b.expected - a.expected);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <h2 className="font-semibold text-slate-800">Expected vs. Actual Summary</h2>
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
            {summaryData.map((row) => {
              let statusColor = "text-slate-500"; 
              if (row.expected > 0 || row.actual > 0) {
                statusColor = row.difference >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium";
              }

              return (
                <tr key={row.taxId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{row.companyName}</div>
                    <div className="text-xs text-slate-500">S/N: {row.taxId}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {row.expected > 0 ? row.expected.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {row.actual > 0 ? row.actual.toLocaleString() : '-'}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${statusColor}`}>
                    {row.difference > 0 ? '+' : ''}{row.difference.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}