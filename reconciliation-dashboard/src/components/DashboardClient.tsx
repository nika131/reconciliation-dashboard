'use client'

import { useState } from "react"
import { useCompanies, useTransactions, useAutoMatch } from "@/hooks/useDashboard"
import { DashboardFilters } from "@/schemas"
import { SummaryBoard } from "./SummaryBoard"
import { TransactionTable } from "./TransactionTable"
import { StatsBar } from "./StatsBar"
import toast from "react-hot-toast"

export function DashboardClient() {

    const [filters, setFilters] = useState<DashboardFilters>({
        year: 2026,
        month: 4,
        status: 'all',
    })

    const [searchTerm, setSearchTerm] = useState('')

    const { data: companies = [] } = useCompanies()
    const { data: allTransactions = [] } = useTransactions(filters)
    const { mutate: runMatching, isPending: isMatching } = useAutoMatch();

    const filteredCompanies = companies.filter(c => {
      if (!searchTerm) return true
      const term = searchTerm.toLocaleLowerCase()
      return c.name.toLowerCase().includes(term) || c.tax_id.includes(term)
    })

    const filteredTransactions = allTransactions.filter(t => {
      if (filters.status !== 'all' && t.status !== filters.status) return false

      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()

      const matchesSender = t.sender_name?.toLowerCase().includes(term) || t.sender_inn?.includes(term);
      const linkedCompany = companies.find(c => c.id === t.matched_company_id);
      const matchesCompany = linkedCompany && (linkedCompany.name.toLowerCase().includes(term) || linkedCompany.tax_id.includes(term));
    
      return matchesSender || matchesCompany
    })
    
    const handleMatchClick = () => {
        runMatching(undefined, {
            onSuccess: (count) => {
              toast.success(`Successfully matched ${count} transactions!`)
            }
        })
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-slate-300 rounded-md bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select 
            className="p-2 border border-slate-300 rounded-md bg-slate-50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.month}
            onChange={(e) => setFilters(prev => ({ ...prev, month: Number(e.target.value) }))}
          >
            <option value={4}>April 2026</option>
            <option value={5}>May 2026</option>
            <option value={6}>June 2026</option>
          </select>

          <select 
            className="p-2 border border-slate-300 rounded-md bg-slate-50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          disabled={isMatching}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isMatching ? 'Matching in DB...' : 'Run Auto-Matching'}
        </button>

      </div>

      <StatsBar transactions={allTransactions} />

      <SummaryBoard
        companies={filteredCompanies}
        year={filters.year}
        month={filters.month}
      />

      <TransactionTable
        transactions={filteredTransactions}
        companies={companies}
      />

    </div>
  );
}