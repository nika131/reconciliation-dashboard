CREATE OR REPLACE FUNCTION match_bank_transactions()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  matched_count INT;
BEGIN
  WITH updated AS (
    UPDATE bank_transactions bt
    SET 
      matched_company_id = c.id,
      match_method = 'inn_exact',
      match_confidence = 1.00,
      status = 'matched'
    FROM companies c
    WHERE bt.status = 'unmatched'
      AND bt.sender_inn = c.tax_id
    RETURNING bt.id
  )
  SELECT count(*) INTO matched_count FROM updated;

  RETURN matched_count;
END;
$$;