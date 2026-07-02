CREATE OR REPLACE FUNCTION get_monthly_summary(p_year INT, p_month INT)
RETURNS TABLE (
    company_id TEXT,
    expected_amount NUMERIC,
    actual_amount NUMERIC
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_target_start DATE := make_date(p_year, p_month, 1);
    v_target_end DATE := (v_target_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
BEGIN
    RETURN QUERY
    WITH ExpectedCTE AS (
        SELECT c.company_id, SUM(c.monthly_amount) as expected
        FROM contracts c
        WHERE NOT (c.status IN ('paused', 'ended') AND c.end_date IS NULL)
          AND c.start_date <= v_target_end
          AND (c.end_date IS NULL OR c.end_date >= v_target_start)
        GROUP BY c.company_id
    ),
    ActualCTE AS (
        SELECT bt.matched_company_id AS company_id, SUM(bt.amount) as actual
        FROM bank_transactions bt
        WHERE bt.status = 'matched'
          AND bt.entry_date >= v_target_start
          AND bt.entry_date <= v_target_end
        GROUP BY bt.matched_company_id
    )
    SELECT comp.id::TEXT, COALESCE(e.expected, 0) AS expected_amount, COALESCE(a.actual, 0) AS actual_amount
    FROM companies comp
    LEFT JOIN ExpectedCTE e ON comp.id = e.company_id
    LEFT JOIN ActualCTE a ON comp.id = a.company_id;
END;
$$;