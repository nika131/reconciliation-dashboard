'use client'

import { useState } from "react"
import { useCompanies, useContracts, useTransactions, useAutoMatch } from "@/hooks/useDashboard"
import { DashboardFilters } from "@/schemas"
import { SummaryBoard } from "./SummaryBoard"
import { TransactionTable } from "./TransactionTable"
import { StatsBar } from "./StatsBar"

export function DashboardClient() {
    const [filters, setFilters] = useState<DashboardFilters>({
        year: 2026,
        month: 4,
        status: 'all',
    })

    const { data: companies = [], isLoading: loadingCos } = useCompanies()
    const { data: contracts = [], isLoading: loadingContracts } = useContracts()
    const { data: allTransactions = [], isLoading: loadingTx, isFetching } = useTransactions(filters)

    const { mutate: runMatching, isPending: isMatching } = useAutoMatch();

    const filteredTransactions = filters.status === 'all'
      ? allTransactions
      : allTransactions.filter(t => t.status === filters.status);
    
    const handleMatchClick = () => {
        runMatching(undefined, {
            onSuccess: (count) => {
                alert(`Successfully matched ${count} transactions!`)
            },
            onError: (err) => {
                alert(`Error: ${err.message}`)
            }
        })
    }

    const isLoading = loadingCos || loadingContracts || loadingTx

    return (
    <div className="space-y-6">
      {/* --- CONTROL INTERFACE --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
        
        <div className="flex gap-4">
          <select 
            className="p-2 border border-slate-300 rounded-md bg-slate-50 text-sm font-medium"
            value={filters.month}
            onChange={(e) => setFilters(prev => ({ ...prev, month: Number(e.target.value) }))}
          >
            <option value={4}>April 2026</option>
            <option value={5}>May 2026</option>
            <option value={6}>June 2026</option>
          </select>

          <select 
            className="p-2 border border-slate-300 rounded-md bg-slate-50 text-sm font-medium"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as DashboardFilters['status'] }))}
          >
            <option value="all">All Statuses</option>
            <option value="matched">Matched</option>
            <option value="unmatched">Unmatched</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>

        <button 
          onClick={handleMatchClick}
          disabled={isMatching || isFetching}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isMatching ? 'Matching in DB...' : 'Run Auto-Matching'}
        </button>

      </div>

      {/* --- TEMPORARY LOADING/DATA STATE --- */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-500 animate-pulse">Loading dashboard data...</div>
      ) : (
        <>
          <StatsBar transactions={allTransactions} />

          <SummaryBoard
            companies={companies}
            contracts={contracts}
            transactions={allTransactions}
            year={filters.year}
            month={filters.month}
          />

          <TransactionTable
            transactions={filteredTransactions}
            companies={companies}
          />
        </>
      )}

    </div>
  );
}