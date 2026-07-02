import { Transaction } from '@/schemas';
import { MonthlyStats } from '@/schemas';

interface StatsBarProps {
    stats: MonthlyStats | undefined
}

export function StatsBar({ stats }: StatsBarProps) {
    if (!stats) return null

    const matchRate = stats.total_transactions > 0
        ? Math.round((stats.matched_transactions / stats.total_transactions) * 100)
        : 0

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 font-medium mb-1">Total Transactions</div>
                <div className="text-2xl font-bold text-slate-900">{stats.total_transactions}</div>
                <div className="text-sm text-slate-600 mt-1">{stats.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} GEL</div>
            </div>
            
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                <div className="text-sm text-emerald-600 font-medium mb-1">Matched</div>
                <div className="text-2xl font-bold text-emerald-700">{stats.matched_transactions}</div>
                <div className="text-sm text-emerald-600 mt-1">{stats.matched_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} GEL</div>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 shadow-sm">
                <div className="text-sm text-rose-600 font-medium mb-1">Unmatched</div>
                <div className="text-2xl font-bold text-rose-700">{stats.unmatched_transactions}</div>
                <div className="text-sm text-rose-600 font-medium flex justify-between">
                    <span>{stats.unmatched_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} GEL</span>
                    <span className="text-rose-400/80 text-xs">({stats.ignored_transactions} ignored)</span>
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