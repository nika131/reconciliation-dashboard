import { supabase } from '@/lib/supabase';
import { CompanySchema, ContractSchema, TransactionSchema, DashboardFilters, DashboardFiltersSchema, MonthlySummarySchema } from '@/schemas';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { z } from 'zod';
import { MonthlyStatsSchema, MonthlyStats } from '@/schemas';

export async function fetchCompanies() {
    const { data, error } = await supabase.from('companies').select('*')
    if (error) throw new Error(error.message)
    return z.array(CompanySchema).parse(data)
}

export async function fetchTransactions(filters: DashboardFilters) {
    const validatedFilters = DashboardFiltersSchema.parse(filters);
    const { year, month, status, page, search } = validatedFilters

    const targetDate = new Date(year, month - 1)
    const startDateStr = format(startOfMonth(targetDate), 'yyyy-MM-dd')
    const endDateStr = format(endOfMonth(targetDate), 'yyyy-MM-dd')

    const ITEMS_PER_PAGE = 50
    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    let query = supabase
        .from('bank_transactions')
        .select('*', { count: 'exact' }) 
        .gte('entry_date', startDateStr)
        .lte('entry_date', endDateStr)
        .order('entry_date', { ascending: false })
        .range(from, to);

    if (status !== 'all') {
        query = query.eq('status', status)
    }

    if (search && search.trim() !== '') {
        const safeSearch = search.replace(/[,\(\)]/g, '').trim()

        if (safeSearch){
            query = query.or(`sender_name.ilike.%${search}%,sender_inn.ilike.%${search}%`)
        }
    }
    
    const { data, count, error } = await query

    if (error) throw new Error(error.message)

    return {
        data: z.array(TransactionSchema).parse(data || []),
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
        currentPage: page,
    } 
}

export async function fetchMonthlySummary(year: number, month: number) {
    const { data, error } = await supabase.rpc('get_monthly_summary', {
        p_year: year,
        p_month: month
    })

    if (error) throw new Error(error.message)
    return z.array(MonthlySummarySchema).parse(data)
}

export async function fetchMonthlyStats(year: number, month: number): Promise<MonthlyStats>{
    const { data, error } = await supabase.rpc('get_monthly_stats', {
        p_year: year,
        p_month: month
    })

    if (error) throw new Error(error.message)

    const parseData = z.array(MonthlyStatsSchema).parse(data)

    const [row] = parseData
    if (!row) throw new Error('get_monthly_stats returned no rows')

    return row
 }