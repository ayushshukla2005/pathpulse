DO $$ BEGIN
  REVOKE UPDATE, DELETE ON TABLE "audit_logs" FROM pathpulse;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION prevent_audit_logs_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is an append-only table. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_logs_modification ON "audit_logs";
CREATE TRIGGER trg_prevent_audit_logs_modification
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_logs_modification();
