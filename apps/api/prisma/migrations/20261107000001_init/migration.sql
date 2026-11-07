CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "UserRole" AS ENUM ('USER', 'CONTRIBUTOR', 'MODERATOR', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN');

CREATE TYPE "MobilityProfile" AS ENUM ('WHEELCHAIR', 'LIMITED_MOBILITY', 'VISUAL_IMPAIRMENT', 'HEARING_IMPAIRMENT', 'STROLLER', 'CUSTOM');

CREATE TYPE "ConnectionType" AS ENUM ('CORRIDOR', 'RAMP', 'STAIRS', 'ELEVATOR', 'DOOR');

CREATE TYPE "OperationalStatus" AS ENUM ('OPERATIONAL', 'OUT_OF_SERVICE', 'UNKNOWN');

CREATE TYPE "VerificationLevel" AS ENUM ('CONFIRMED', 'UNVERIFIED', 'UNAVAILABLE');

CREATE TYPE "ReportCategory" AS ENUM ('BROKEN_LIFT', 'BLOCKED_RAMP', 'INACCESSIBLE_ENTRANCE', 'OTHER');

CREATE TYPE "ReportStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'RESOLUTION_SUBMITTED', 'CLOSED', 'REJECTED', 'REOPENED');

CREATE TYPE "FacilityType" AS ENUM ('ELEVATOR', 'RAMP', 'ACCESSIBLE_RESTROOM', 'ENTRANCE', 'TACTILE_PAVING', 'PARKING_BAY', 'HELP_DESK');

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mobility_profile" "MobilityProfile" NOT NULL DEFAULT 'CUSTOM',
    "requires_step_free" BOOLEAN NOT NULL DEFAULT false,
    "requires_elevator" BOOLEAN NOT NULL DEFAULT false,
    "max_slope_percent" DOUBLE PRECISION,
    "min_door_width_cm" INTEGER,
    "requires_tactile_paving" BOOLEAN NOT NULL DEFAULT false,
    "requires_audio_alerts" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geography(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "building_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "floors" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "floor_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "level_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "map_nodes" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "floor_id" TEXT NOT NULL,
    "node_type" TEXT NOT NULL,
    "name" TEXT,
    "x_coordinate" DOUBLE PRECISION NOT NULL,
    "y_coordinate" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_accessible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "map_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "map_edges" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT NOT NULL,
    "connection_type" "ConnectionType" NOT NULL DEFAULT 'CORRIDOR',
    "distance_meters" DOUBLE PRECISION NOT NULL,
    "step_free" BOOLEAN NOT NULL DEFAULT true,
    "width_cm" INTEGER,
    "slope_percent" DOUBLE PRECISION,
    "surface" TEXT,
    "operational_status" "OperationalStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "verification_level" "VerificationLevel" NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "map_edges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "building_id" TEXT,
    "floor_id" TEXT,
    "node_id" TEXT,
    "facility_type" "FacilityType" NOT NULL,
    "name" TEXT NOT NULL,
    "operational_status" "OperationalStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "verification_level" "VerificationLevel" NOT NULL DEFAULT 'CONFIRMED',
    "last_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "issue_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "facility_id" TEXT,
    "category" "ReportCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "caption" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "maintenance_tasks" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "resolution_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "venue_id" TEXT,
    "changes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");
CREATE INDEX "users_role_idx" ON "users"("role");

CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

CREATE INDEX "venues_organization_id_idx" ON "venues"("organization_id");

CREATE INDEX "buildings_venue_id_idx" ON "buildings"("venue_id");

CREATE INDEX "floors_building_id_idx" ON "floors"("building_id");
CREATE UNIQUE INDEX "floors_building_id_floor_number_key" ON "floors"("building_id", "floor_number");

CREATE INDEX "map_nodes_building_id_idx" ON "map_nodes"("building_id");
CREATE INDEX "map_nodes_floor_id_idx" ON "map_nodes"("floor_id");

CREATE INDEX "map_edges_building_id_idx" ON "map_edges"("building_id");
CREATE INDEX "map_edges_from_node_id_idx" ON "map_edges"("from_node_id");
CREATE INDEX "map_edges_to_node_id_idx" ON "map_edges"("to_node_id");
CREATE INDEX "map_edges_operational_status_idx" ON "map_edges"("operational_status");
CREATE UNIQUE INDEX "map_edges_from_node_id_to_node_id_key" ON "map_edges"("from_node_id", "to_node_id");

CREATE INDEX "facilities_venue_id_idx" ON "facilities"("venue_id");
CREATE INDEX "facilities_building_id_idx" ON "facilities"("building_id");
CREATE INDEX "facilities_facility_type_idx" ON "facilities"("facility_type");
CREATE INDEX "facilities_operational_status_idx" ON "facilities"("operational_status");

CREATE INDEX "issue_reports_user_id_idx" ON "issue_reports"("user_id");
CREATE INDEX "issue_reports_venue_id_idx" ON "issue_reports"("venue_id");
CREATE INDEX "issue_reports_facility_id_idx" ON "issue_reports"("facility_id");
CREATE INDEX "issue_reports_status_idx" ON "issue_reports"("status");

CREATE INDEX "evidence_report_id_idx" ON "evidence"("report_id");

CREATE INDEX "verifications_report_id_idx" ON "verifications"("report_id");
CREATE INDEX "verifications_reviewer_id_idx" ON "verifications"("reviewer_id");

CREATE INDEX "maintenance_tasks_report_id_idx" ON "maintenance_tasks"("report_id");
CREATE INDEX "maintenance_tasks_organization_id_idx" ON "maintenance_tasks"("organization_id");
CREATE INDEX "maintenance_tasks_assigned_to_id_idx" ON "maintenance_tasks"("assigned_to_id");
CREATE INDEX "maintenance_tasks_status_idx" ON "maintenance_tasks"("status");

CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_read_at_idx" ON "notifications"("read_at");

CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "venues" ADD CONSTRAINT "venues_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "buildings" ADD CONSTRAINT "buildings_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "floors" ADD CONSTRAINT "floors_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "map_nodes" ADD CONSTRAINT "map_nodes_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "map_nodes" ADD CONSTRAINT "map_nodes_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "map_edges" ADD CONSTRAINT "map_edges_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "map_edges" ADD CONSTRAINT "map_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "map_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "map_edges" ADD CONSTRAINT "map_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "map_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "facilities" ADD CONSTRAINT "facilities_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "facilities" ADD CONSTRAINT "facilities_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "facilities" ADD CONSTRAINT "facilities_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "facilities" ADD CONSTRAINT "facilities_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "map_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "issue_reports" ADD CONSTRAINT "issue_reports_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "evidence" ADD CONSTRAINT "evidence_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "issue_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "verifications" ADD CONSTRAINT "verifications_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "issue_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "verifications" ADD CONSTRAINT "verifications_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "issue_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
