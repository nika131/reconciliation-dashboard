import { z } from 'zod';

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  tax_id: z.string(),
});

export const ContractSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  monthly_amount: z.coerce.number(), 
  status: z.enum(['active', 'paused', 'ended']),
  start_date: z.string(),
  end_date: z.string().nullable(),
});

export const TransactionSchema = z.object({
  id: z.string(),
  doc_key: z.string(),
  entry_date: z.string(),
  amount: z.coerce.number(),
  currency: z.string().default('GEL'),
  sender_name: z.string().nullable(),
  sender_inn: z.string().nullable(),
  sender_account: z.string().nullable(),
  purpose: z.string().nullable(),
  status: z.enum(['matched', 'unmatched', 'ignored']),
  matched_company_id: z.string().nullable(),
  match_method: z.string().nullable(),
  match_confidence: z.coerce.number().nullable(),
})

export const MonthlySummarySchema = z.object({
  company_id: z.string(),
  expected_amount: z.coerce.number(),
  actual_amount: z.coerce.number(),
})

export const DashboardFiltersSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  status: z.enum(['all', 'matched', 'unmatched', 'ignored']).default('all'),
})

export type Company = z.infer<typeof CompanySchema>;
export type Contract = z.infer<typeof ContractSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type DashboardFilters = z.infer<typeof DashboardFiltersSchema>;
export type MonthlySummaryRow = z.infer<typeof MonthlySummarySchema>;