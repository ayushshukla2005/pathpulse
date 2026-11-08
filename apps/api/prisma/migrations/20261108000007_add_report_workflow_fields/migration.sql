ALTER TABLE "issue_reports" ADD COLUMN IF NOT EXISTS "assigned_to_user_id" TEXT;
ALTER TABLE "issue_reports" ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMPTZ(3);
ALTER TABLE "issue_reports" ADD COLUMN IF NOT EXISTS "verified_by_user_id" TEXT;
ALTER TABLE "issue_reports" ADD COLUMN IF NOT EXISTS "reopen_count" INTEGER NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_assigned_to_user_id_fkey"
    FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_verified_by_user_id_fkey"
    FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "issue_reports_assigned_to_user_id_idx" ON "issue_reports"("assigned_to_user_id");
CREATE INDEX IF NOT EXISTS "issue_reports_verified_by_user_id_idx" ON "issue_reports"("verified_by_user_id");

ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "actor_user_id" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "from_status" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "to_status" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "reason" TEXT;

CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "report_id" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'STATUS_CHANGE';

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_report_id_fkey"
    FOREIGN KEY ("report_id") REFERENCES "issue_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "notifications_report_id_idx" ON "notifications"("report_id");

