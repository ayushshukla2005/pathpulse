-- CreateIndex
CREATE INDEX IF NOT EXISTS "facilities_building_id_operational_status_idx" ON "facilities"("building_id", "operational_status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "issue_reports_venue_id_status_idx" ON "issue_reports"("venue_id", "status");
