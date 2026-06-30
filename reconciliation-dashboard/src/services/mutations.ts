import { supabase } from "@/lib/supabase";

export async function runAutoMatching() {
    const { data, error } = await supabase.rpc('match_bank_transactions')
    if (error) throw new Error(error.message)
    return data as number;
}