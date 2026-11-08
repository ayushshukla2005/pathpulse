DO $$ BEGIN
  CREATE TYPE "EvidenceStatus" AS ENUM ('PENDING_UPLOAD', 'RECEIVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "issue_reports" ADD COLUMN IF NOT EXISTS "tracking_code" TEXT;
ALTER TABLE "issue_reports" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "issue_reports" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "issue_reports" ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326);
ALTER TABLE "issue_reports" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "issue_reports" ALTER COLUMN "venue_id" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "issue_reports_tracking_code_key" ON "issue_reports"("tracking_code");

ALTER TABLE "evidence" DROP COLUMN IF EXISTS "image_url";
ALTER TABLE "evidence" DROP COLUMN IF EXISTS "file_key";
ALTER TABLE "evidence" DROP COLUMN IF EXISTS "caption";
ALTER TABLE "evidence" DROP COLUMN IF EXISTS "uploaded_at";

ALTER TABLE "evidence" ADD COLUMN IF NOT EXISTS "object_key" TEXT NOT NULL;
ALTER TABLE "evidence" ADD COLUMN IF NOT EXISTS "content_type" TEXT NOT NULL;
ALTER TABLE "evidence" ADD COLUMN IF NOT EXISTS "size_bytes" INTEGER NOT NULL;
ALTER TABLE "evidence" ADD COLUMN IF NOT EXISTS "status" "EvidenceStatus" NOT NULL DEFAULT 'PENDING_UPLOAD';
ALTER TABLE "evidence" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "evidence" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "evidence_object_key_key" ON "evidence"("object_key");
CREATE INDEX IF NOT EXISTS "evidence_status_idx" ON "evidence"("status");

