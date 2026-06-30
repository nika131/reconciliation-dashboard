import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCompanies, fetchContracts, fetchTransactions } from '@/services/queries';
import { DashboardFilters } from '@/schemas';
import { runAutoMatching } from '@/services/mutations';

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: Infinity, 
  });
}

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: fetchContracts,
    staleTime: Infinity, 
  });
}

export function useTransactions(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['transactions', filters.year, filters.month, filters.status],
    queryFn: () => fetchTransactions(filters),
    staleTime: 1000 * 60 * 5, 
    placeholderData: (previousData) => previousData, // Prevents UI flicker
  });
}

export function useAutoMatch() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: runAutoMatching,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
        },
    })
}