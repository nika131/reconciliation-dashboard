import { Transaction } from '@/schemas';

interface StatsBarProps {
    transactions: Transaction[];
}

export function StatsBar({ transactions }: StatsBarProps) {
    const total = transactions.length;
    const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    const matched = transactions.filter(t => t.status === 'matched')
    const unmatched = transactions.filter(t => t.status === 'unmatched')
    const ignored = transactions.filter(t => t.status === 'ignored')
    const unmatchedAmount = unmatched.reduce((sum, t) => sum + t.amount, 0);

    const matchedAmount = matched.reduce((sum, t) => sum + t.amount, 0);
    const matchRate = total === 0 ? 0 : Math.round((matched.length / total) * 100)

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 font-medium mb-1">Total Transactions</div>
                <div className="text-2xl font-bold text-slate-900">{total}</div>
                <div className="text-sm text-slate-600 mt-1">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} GEL</div>
            </div>
            
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                <div className="text-sm text-emerald-600 font-medium mb-1">Matched</div>
                <div className="text-2xl font-bold text-emerald-700">{matched.length}</div>
                <div className="text-sm text-emerald-600 mt-1">{matchedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} GEL</div>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 shadow-sm">
                <div className="text-sm text-rose-600 font-medium mb-1">Unmatched</div>
                <div className="text-2xl font-bold text-rose-700">{unmatched.length}</div>
                <div className="text-sm text-rose-600 font-medium flex justify-between">
                    <span>{unmatchedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} GEL</span>
                    <span className="text-rose-400/80 text-xs">({ignored.length} ignored)</span>
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="text-sm text-blue-600 font-medium mb-1">Match Rate</div>
                <div className="text-2xl font-bold text-blue-700">{matchRate}%</div>
                <div className="w-full bg-blue-200 h-2 mt-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full" style={{ width: `${matchRate}%` }}></div>
                </div>
            </div>
        </div>
    )
}