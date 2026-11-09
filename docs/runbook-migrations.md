# PathPulse Production Database Migration Runbook

This document defines the standard operating procedures for executing, verifying, and rolling back relational database migrations in production and staging environments for PathPulse.

## 1. Principles and Invariants

1. **Decoupled Lifecycle**: Database migrations never run inside the application runtime or container startup entrypoints. Running migrations on multi-replica container startup causes concurrent migration lock contention and unpredictable failure modes. Migrations run as dedicated one-off release jobs in the deployment pipeline.
2. **Backwards Compatibility (Expand-Contract Pattern)**: Schema changes must be backwards-compatible with the immediately preceding application version. Deployments follow a two-step cycle:
   - **Step 1 (Expand)**: Add columns as nullable or with defaults, add tables, add indices concurrently. Old and new code versions both operate cleanly.
   - **Step 2 (Contract)**: After the new application code is verified in production and traffic fully cut over, a subsequent migration removes obsolete columns or applies strict constraints.
3. **Append-Only Audit Log Invariant**: The PostgreSQL table `audit_logs` is protected by the `prevent_audit_logs_tamper` trigger. No migration is ever permitted to drop this trigger, alter existing audit records, or circumvent the tamper-evident log guarantee.

---

## 2. Pre-Deployment Procedure

Before initiating any schema migration on production:

### 2.1 Coordinated Maintenance Window & Notification
Verify active database replica lag is below 100ms. Notify engineering and on-call leads.

### 2.2 Point-in-Time Backup / Snapshot
Ensure an automated snapshot or manual dump is completed immediately prior to execution:

```bash
# Example manual logical dump for PostgreSQL
export PGPASSWORD="${DATABASE_PASSWORD}"
pg_dump -h "${DATABASE_HOST}" -p "${DATABASE_PORT}" -U "${DATABASE_USER}" \
  -d "${DATABASE_NAME}" -F c -b -v -f "pre_migration_backup_$(date +%Y%m%d_%H%M%S).dump"
```

Verify backup artifact integrity by confirming non-zero byte size and valid archive header.

---

## 3. Migration Execution

### 3.1 Migration Command
PathPulse uses Prisma with PostgreSQL and PostGIS extensions. Production migrations are applied exclusively via:

```bash
pnpm --filter @pathpulse/api migrate:deploy
# or directly inside the migration container:
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

### 3.2 Automated CI/CD Release Phase
In containerized environments (Render, AWS ECS, or Kubernetes), execute `prisma migrate deploy` as a pre-deploy or release task:
- **Render**: Configure `preDeployCommand: "pnpm --filter @pathpulse/api migrate:deploy"` in `render.yaml`.
- **Kubernetes**: Run a Kubernetes Job that executes the migration container before updating the Deployment replica set.

---

## 4. Verification and Readiness Inspection

### 4.1 Check Migration Status
Verify that all applied migrations match target checksums:

```bash
pnpm --filter @pathpulse/api exec prisma migrate status
```

Expected output:
```text
Database schema is up to date!
```

### 4.2 Deep Health & Readiness Check
Query the API's readiness endpoint:

```bash
curl -f https://<api-domain>/api/v1/health/ready
```

- Expected HTTP Status: `200 OK`
- Expected Payload: `{"status":"ready"}`
- If migrations are pending or database connectivity is disrupted, returns `503 Service Unavailable` with `{"status":"not_ready","reason":"pending_migrations"}` or `{"status":"not_ready","reason":"database_unreachable"}`.

### 4.3 Audit Log Trigger Integrity Check
Confirm that the tamper-evident trigger on `audit_logs` remains intact:

```sql
SELECT tgname, tgenabled, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'prevent_audit_logs_tamper';
```

Verification query must return 1 row with `tgenabled = 'O'` (enabled). Attempting an `UPDATE` or `DELETE` on `audit_logs` must be rejected with exception:
`Cannot modify or delete audit log entries. Audit log is append-only.`

---

## 5. Rollback and Remediation Strategy

### 5.1 Non-Destructive Migrations (Preferred Forward Fix)
If application health checks fail after migration:
1. Revert application code container to the previous stable release. Because migrations are designed according to the expand-contract pattern, the old application version continues functioning with the expanded schema.
2. Prepare a forward-fixing migration script that repairs anomalies without destructive resets.

### 5.2 Destructive Migration Rollback (Emergency Procedure)
If a schema change introduced severe corruption or table locking:
1. Route ingress to maintenance page (drain traffic).
2. If schema rollback is strictly needed, run reverse SQL commands manually curated for the failed migration, or restore the database from the pre-migration snapshot:

```bash
# Restore PostgreSQL from backup dump:
pg_restore -h "${DATABASE_HOST}" -p "${DATABASE_PORT}" -U "${DATABASE_USER}" \
  -d "${DATABASE_NAME}" --clean --if-exists -v "pre_migration_backup_<TIMESTAMP>.dump"
```

3. Update the `_prisma_migrations` tracking table if manual schema adjustments were made.
4. Run `pnpm --filter @pathpulse/api exec prisma migrate status` to confirm synchronization.
5. Re-run `/api/v1/health/ready` check and restore ingress traffic.
