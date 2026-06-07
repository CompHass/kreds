CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS trigger AS $$
BEGIN
	RAISE EXCEPTION 'ledger tables are append-only';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER ledger_transactions_append_only
BEFORE UPDATE OR DELETE ON "ledger_transactions"
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();
--> statement-breakpoint
CREATE TRIGGER ledger_lines_append_only
BEFORE UPDATE OR DELETE ON "ledger_lines"
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();
