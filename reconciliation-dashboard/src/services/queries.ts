import { supabase } from '@/lib/supabase';
import { CompanySchema, ContractSchema, TransactionSchema, DashboardFilters, DashboardFiltersSchema } from '@/schemas';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { z } from 'zod';

export async function fetchCompanies() {
    const { data, error } = await supabase.from('companies').select('*')
    if (error) throw new Error(error.message)
    return z.array(CompanySchema).parse(data)
}

export async function fetchContracts() {
    const { data, error } = await supabase.from('contracts').select('*');
    if (error) throw new Error(error.message)
    return z.array(ContractSchema).parse(data)
}

export async function fetchTransactions(filters: DashboardFilters) {
    const validatedFilters = DashboardFiltersSchema.parse(filters);
    
    const { year, month } = validatedFilters

    const targetDate = new Date(year, month - 1)
    const startDateStr = format(startOfMonth(targetDate), 'yyyy-MM-dd')
    const endDateStr = format(endOfMonth(targetDate), 'yyyy-MM-dd')

    const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .gte('entry_date', startDateStr)
        .lte('entry_date', endDateStr)
        .order('entry_date', { ascending: false})

    if (error) throw new Error(error.message)

    return z.array(TransactionSchema).parse(data || [])
}
