import { supabase } from "@/lib/supabase";

export async function runAutoMatching() {
    const { data, error } = await supabase.rpc('match_bank_transactions')
    if (error) throw new Error(error.message)
    return data as number;
}

export async function updateTransactionStatus(
    id: string,
    status: 'matched' | 'unmatched' | 'ignored'
) {
    const updatePayload = status === 'unmatched' || status === 'ignored' 
        ? { 
            status, 
            matched_company_id: null, 
            match_method: null, 
            match_confidence: null 
        }
        : { 
            status, 
            match_method: 'manual' 
        }

    const { error } = await supabase
        .from('bank_transactions')
        .update(updatePayload)
        .eq('id', id)
    
    if (error) throw new Error(error.message)
    return true;
}