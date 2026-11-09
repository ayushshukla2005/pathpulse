# ADR-0003: Append-Only Audit Log with PostgreSQL Tamper-Evident Trigger

## Status
Accepted

## Context
PathPulse manages critical accessibility barriers and physical facility outage reports. Regulatory standards (e.g. India RPwD Act 2016, WCAG 2.2, campus safety compliance) require reliable records of who changed the status of an accessibility facility or report, what was modified, and when.
Application-level audit logging alone is vulnerable: a compromised application container, rogue administrator, or SQL injection vulnerability could update or delete historical audit entries to conceal misconduct.

## Decision
Enforce audit log immutability directly at the database engine layer:
1. **Trigger Definition**:
   ```sql
   CREATE OR REPLACE FUNCTION prevent_audit_logs_tamper()
   RETURNS TRIGGER AS $$
   BEGIN
     RAISE EXCEPTION 'Cannot modify or delete audit log entries. Audit log is append-only.';
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER prevent_audit_logs_tamper
   BEFORE UPDATE OR DELETE ON audit_logs
   FOR EACH ROW
   EXECUTE FUNCTION prevent_audit_logs_tamper();
   ```
2. **Transaction Atomicity**: Application operations that change facility or report state must execute the state change and the audit log insertion in the same database transaction.
3. **Migration Runbook Rule**: No migration script or operational procedure is permitted to drop or disable `prevent_audit_logs_tamper`.

## Consequences
### Positive
- Absolute immutability: Any `UPDATE` or `DELETE` statement issued against `audit_logs` fails immediately with a descriptive database exception.
- Audit completeness: Triggers execute regardless of whether queries originate from NestJS, raw SQL clients, or administrative scripts.

### Negative / Trade-offs
- Audit table rows can never be purged through standard SQL. Retention management must use table partitioning or off-site read-only archival rather than `DELETE`.

