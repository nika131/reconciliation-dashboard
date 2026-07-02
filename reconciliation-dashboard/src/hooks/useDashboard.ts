import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCompanies, fetchMonthlySummary, fetchTransactions } from '@/services/queries';
import { DashboardFilters } from '@/schemas';
import { runAutoMatching, updateTransactionStatus } from '@/services/mutations';
import { Transaction } from '@/schemas';

type UpdateTxInput = 
  | { id: string; status: 'matched'; companyId: string }
  | { id: string; status: 'unmatched' | 'ignored' }

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: Infinity, 
  });
}

export function useTransactions(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['transactions', filters.year, filters.month],
    queryFn: () => fetchTransactions(filters),
    staleTime: 1000 * 60 * 5, 
    placeholderData: (previousData) => previousData, 
  });
}

export function useAutoMatch() {
  const queryClient = useQueryClient()

  return useMutation({
      mutationFn: runAutoMatching,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['summary']})
      },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateTxInput) => {
      const companyId = 'companyId' in input ? input.companyId : undefined;
      return updateTransactionStatus(input.id, input.status, companyId);
    },

    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] })

      // Snapshot of previous value in case we need to roll back
      const previousQueries = queryClient.getQueriesData<Transaction[]>({ queryKey: ['transactions'] });

      queryClient.setQueriesData<Transaction[]>({ queryKey: ['transactions'] }, (old) => {
        if (!old) return old
        return old.map((t) =>
          t.id === newTx.id
            ? { 
                ...t, 
                status: newTx.status, 
                matched_company_id: 'companyId' in newTx ? newTx.companyId : null 
              }
            : t
        )
      })

      return { previousQueries }
    },

    onError: (err, newTx, context) => {
      context?.previousQueries.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
      console.error('Optimistic UI rollback due to server error:', err)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
    }
  })
}

export function useMonthlySummary(year: number, month: number) {
  return useQuery({
    queryKey: ['summary', year, month],
    queryFn: () => fetchMonthlySummary(year, month),
    placeholderData: (previousData) => previousData, 
  })
}