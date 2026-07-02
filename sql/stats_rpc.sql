CREATE OR REPLACE FUNCTION get_monthly_stats(p_year INT, p_month INT)
RETURNS TABLE (
    total_transactions BIGINT,
    total_amount NUMERIC,
    matched_transactions BIGINT,
    matched_amount NUMERIC,
    unmatched_transactions BIGINT,
    unmatched_amount NUMERIC,
    ignored_transactions BIGINT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_target_start DATE := make_date(p_year, p_month, 1);
    v_target_end DATE := (v_target_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) AS total_transactions,
        COALESCE(SUM(amount), 0) AS total_amount,
        
        COUNT(*) FILTER (WHERE status = 'matched') AS matched_transactions,
        COALESCE(SUM(amount) FILTER (WHERE status = 'matched'), 0) AS matched_amount,
        
        COUNT(*) FILTER (WHERE status = 'unmatched') AS unmatched_transactions,
        COALESCE(SUM(amount) FILTER (WHERE status = 'unmatched'), 0) AS unmatched_amount,
        
        COUNT(*) FILTER (WHERE status = 'ignored') AS ignored_transactions
    FROM bank_transactions
    WHERE entry_date >= v_target_start 
      AND entry_date <= v_target_end;
END;
$$;
