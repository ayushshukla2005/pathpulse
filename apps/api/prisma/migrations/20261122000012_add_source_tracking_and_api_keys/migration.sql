CREATE TYPE "DataSource" AS ENUM ('SEED_DEMO', 'OSM', 'OPERATOR', 'COMMUNITY', 'MANUAL');

ALTER TABLE "venues" ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'SEED_DEMO',
ADD COLUMN "source_license" TEXT,
ADD COLUMN "source_ref" TEXT;

CREATE UNIQUE INDEX "venues_source_source_ref_key" ON "venues"("source", "source_ref");

ALTER TABLE "buildings" ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'SEED_DEMO',
ADD COLUMN "source_license" TEXT,
ADD COLUMN "source_ref" TEXT;

CREATE UNIQUE INDEX "buildings_source_source_ref_key" ON "buildings"("source", "source_ref");

ALTER TABLE "facilities" ADD COLUMN "notes" TEXT,
ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'SEED_DEMO',
ADD COLUMN "source_license" TEXT,
ADD COLUMN "source_ref" TEXT;

CREATE UNIQUE INDEX "facilities_source_source_ref_key" ON "facilities"("source", "source_ref");

CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['FACILITY_STATUS_WRITE']::TEXT[],
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX "api_keys_organization_id_idx" ON "api_keys"("organization_id");
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");

ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
