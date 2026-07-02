'use client'

import React, { useEffect, useState } from "react"
import { useCompanies, useTransactions, useAutoMatch, useMonthlyStats } from "@/hooks/useDashboard"
import { DashboardFilters } from "@/schemas"
import { SummaryBoard } from "./SummaryBoard"
import { TransactionTable } from "./TransactionTable"
import { StatsBar } from "./StatsBar"
import toast from "react-hot-toast"

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function DashboardClient() {

    const [filters, setFilters] = useState<DashboardFilters>({
        year: 2026,
        month: 6,
        status: 'all',
        page: 1,
    })

    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearch = useDebounce(searchTerm, 300)

    const { data: companies = [] } = useCompanies()

    const defaultTxData = { data: [], totalCount: 0, totalPages: 1, currentPage: 1 }
    const { data: txResponse = defaultTxData, isFetching: loadingTx } = useTransactions({ 
      ...filters, 
      search: debouncedSearch
    })

    const { data: globalStats } = useMonthlyStats(filters.year, filters.month);
    
    const { mutate: runMatching, isPending: isMatching } = useAutoMatch();

    // --- CLIENT-SIDE FILTER (For Companies Only) ---
    const filteredCompanies = companies.filter(c => {
      if (!searchTerm) return true
      const term = searchTerm.toLocaleLowerCase()
      return c.name.toLowerCase().includes(term) || c.tax_id.includes(term)
    })
    
    const handleMatchClick = () => {
        runMatching(undefined, {
            onSuccess: (count) => {
              toast.success(`Successfully matched ${count} transactions!`)
            }
        })
    }

    const handleNextPage = () => setFilters(prev => ({ ...prev, page: Math.min(prev.page + 1, txResponse.totalPages) }))
    const handlePrevPage = () => setFilters(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value)
      setFilters(prev => ({ ...prev, page: 1}))
    }

    return (
    <div className="space-y-6">
      {/* --- CONTROL INTERFACE --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
        
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="მოძებნე კომპანია ან ს/კ..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="p-2 border border-slate-300 rounded-md bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select 
            className="p-2 border border-slate-300 rounded-md bg-slate-50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.month}
            onChange={(e) => setFilters(prev => ({ ...prev, month: Number(e.target.value), page: 1 }))}
          >
            <option value={4}>April 2026</option>
            <option value={5}>May 2026</option>
            <option value={6}>June 2026</option>
          </select>

          <select 
            className="p-2 border border-slate-300 rounded-md bg-slate-50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as DashboardFilters['status'], page: 1 }))}
          >
            <option value="all">All Statuses</option>
            <option value="matched">Matched</option>
            <option value="unmatched">Unmatched</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>

        <button 
          onClick={handleMatchClick}
          disabled={isMatching}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isMatching ? 'Matching in DB...' : 'Run Auto-Matching'}
        </button>

      </div>

      <StatsBar stats={globalStats} />

      <SummaryBoard
        companies={filteredCompanies}
        year={filters.year}
        month={filters.month}
      />

      <TransactionTable
        transactions={txResponse.data}
        companies={companies}
      />

      {txResponse.totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={handlePrevPage}
            disabled={filters.page === 1 || loadingTx}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-md text-sm disabled:opacity-50 hover:bg-slate-200 transition-colors"
          >
            წინა გვერდი (Prev)
          </button>
          <span className="text-sm text-slate-600 font-medium">
            გვერდი (Page) {txResponse.currentPage} / {txResponse.totalPages}
          </span>
          <button 
              onClick={handleNextPage} 
              disabled={filters.page === txResponse.totalPages || loadingTx}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-md text-sm disabled:opacity-50 hover:bg-slate-200 transition-colors"
          >
              შემდეგი (Next)
          </button>
        </div>
      )}

    </div>
  );
}