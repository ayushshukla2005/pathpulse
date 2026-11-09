CREATE TABLE IF NOT EXISTS "ai_suggestions" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "model_version" TEXT NOT NULL,
    "requires_human_verification" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_requires_human_verification" CHECK ("requires_human_verification" = true)
);

CREATE INDEX IF NOT EXISTS "ai_suggestions_report_id_idx" ON "ai_suggestions"("report_id");
CREATE INDEX IF NOT EXISTS "ai_suggestions_kind_idx" ON "ai_suggestions"("kind");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_suggestions_report_id_fkey'
    ) THEN
        ALTER TABLE "ai_suggestions"
        ADD CONSTRAINT "ai_suggestions_report_id_fkey"
        FOREIGN KEY ("report_id") REFERENCES "issue_reports"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

