'use client'

import { useState } from 'react';
import { Transaction, Company } from '@/schemas';
import { useUpdateTransaction } from '@/hooks/useDashboard';

type SortColumn = 'entry_date' | 'amount';
type SortDirection = 'asc' | 'desc';

interface TransactionTableProps {
  transactions: Transaction[];
  companies: Company[];
}

export function TransactionTable({ transactions, companies }: TransactionTableProps) {
    const [sortColumn, setSortColumn] = useState<SortColumn>('entry_date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const { mutate: updateTx, isPending } = useUpdateTransaction(); 

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
        setSortColumn(column);
        setSortDirection('desc');
        }
    };

    const sortedTransactions = [...transactions].sort((a, b) => {
        if (sortColumn === 'amount') {
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        } else {
        const dateA = new Date(a.entry_date).getTime();
        const dateB = new Date(b.entry_date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
    });

    const getCompanyName = (companyId: string | null) => {
        if (!companyId) return '-';
        const company = companies.find(c => c.id === companyId);
        return company ? company.name : 'Unknown';
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h2 className="font-semibold text-slate-800">Raw Transactions</h2>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                            <th 
                                className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort('entry_date')}
                            >
                                Date {sortColumn === 'entry_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-4 py-3 font-medium">Sender Name</th>
                            <th className="px-4 py-3 font-medium">S/N (Tax ID)</th>
                            <th 
                                className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-100 transition-colors text-right"
                                onClick={() => handleSort('amount')}
                            >
                                Amount (GEL) {sortColumn === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-4 py-3 font-medium text-center">Status</th>
                            <th className="px-4 py-3 font-medium">Matched Company</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedTransactions.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                No transactions found for this period and status.
                            </td>
                        </tr>
                        ) : (
                        sortedTransactions.map((tx) => {
                            let statusStyle = "bg-slate-100 text-slate-600"; 
                            if (tx.status === 'matched') statusStyle = "bg-emerald-100 text-emerald-700";
                            if (tx.status === 'unmatched') statusStyle = "bg-rose-100 text-rose-700";

                            return (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{tx.entry_date}</td>
                                    <td className="px-4 py-3 text-slate-900 font-medium">{tx.sender_name || 'Unknown'}</td>
                                    <td className="px-4 py-3 text-slate-500">{tx.sender_inn || '-'}</td>
                                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-700">
                                        {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                                        {tx.status}
                                    </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {getCompanyName(tx.matched_company_id)}
                                    </td>

                                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                                        {tx.status === 'unmatched' && (
                                            <button
                                                onClick={() => updateTx({ id: tx.id, status: 'ignored'})}
                                                disabled={isPending}
                                                className="text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                            >
                                                Ignore
                                            </button>
                                        )}

                                        
                                        {tx.status === 'ignored' && (
                                            <button
                                                onClick={() => updateTx({ id: tx.id, status: 'unmatched'})}
                                                disabled={isPending}
                                                className="text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                            >
                                                Restore                                 
                                            </button>
                                        )}

                                        {tx.status === 'matched' && (
                                            <button
                                                onClick={() => updateTx({ id: tx.id, status: 'unmatched'})}
                                                disabled={isPending}
                                                className="text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                            >
                                                Unmatch
                                            </button>
                                        )}
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