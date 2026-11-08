# PathPulse API Documentation

## Organization & Facility Endpoints

### 1. Organization Dashboard Analytics

- **Endpoint**: `GET /api/v1/organizations/:orgId/dashboard`
- **Access**: `ORGANIZATION_ADMIN` (verified via organization membership) or `SUPER_ADMIN`.
- **Description**: Returns 4 key operational and accessibility metrics computed via SQL database aggregation, alongside a `generatedAt` ISO timestamp.

#### Aggregate SQL Queries

1. **Verified Route Coverage (`verifiedRouteCoverage`)**:
   Calculates the percentage of map edges in the organization's buildings that are both `CONFIRMED` and `OPERATIONAL`. If an organization has no recorded edges, defaults to 100.0%.
   ```sql
   SELECT COALESCE(
     ROUND(
       (COUNT(CASE WHEN me.verification_level = 'CONFIRMED' AND me.operational_status = 'OPERATIONAL' THEN 1 END)::numeric /
        NULLIF(COUNT(me.id), 0)::numeric) * 100,
       1
     ),
     100.0
   )::float AS coverage
   FROM map_edges me
   JOIN buildings b ON me.building_id = b.id
   JOIN venues v ON b.venue_id = v.id
   WHERE v.organization_id = $1;
   ```

2. **Pending Issues (`pendingIssues`)**:
   Counts accessibility barrier reports across all venues owned by the organization that are awaiting review, verification, maintenance, or resolution confirmation:
   ```sql
   SELECT COUNT(*)::int AS count
   FROM issue_reports ir
   JOIN venues v ON ir.venue_id = v.id
   WHERE v.organization_id = $1
     AND ir.status IN ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'RESOLUTION_SUBMITTED', 'REOPENED');
   ```

3. **Verified Facilities (`verifiedFacilities`)**:
   Counts all accessibility facilities (elevators, ramps, accessible restrooms, etc.) with `CONFIRMED` verification level:
   ```sql
   SELECT COUNT(*)::int AS count
   FROM facilities f
   JOIN venues v ON f.venue_id = v.id
   WHERE v.organization_id = $1
     AND f.verification_level = 'CONFIRMED';
   ```

4. **Resolved Reports (`resolvedReports`)**:
   Counts all barrier reports closed and confirmed within the last 30 days:
   ```sql
   SELECT COUNT(*)::int AS count
   FROM issue_reports ir
   JOIN venues v ON ir.venue_id = v.id
   WHERE v.organization_id = $1
     AND ir.status = 'CLOSED'
     AND ir.resolved_at >= NOW() - INTERVAL '30 days';
   ```

---

### 2. Managed Buildings

- **Endpoint**: `GET /api/v1/organizations/:orgId/buildings`
- **Access**: `ORGANIZATION_ADMIN` (for `:orgId`) or `SUPER_ADMIN`.
- **Query scoping**: Scoped to buildings where `venue.organization_id = :orgId`.
- **Response**: Array of building items containing `id`, `name`, `buildingCode`, `graphVersion`, `venueId`, `venueName`, `floorCount`, `facilityCount`.

---

### 3. Managed Facilities

- **Endpoint**: `GET /api/v1/organizations/:orgId/facilities`
- **Access**: `ORGANIZATION_ADMIN` (for `:orgId`) or `SUPER_ADMIN`.
- **Query params**:
  - `buildingId` (optional UUID)
  - `status` (optional `OperationalStatus`: `OPERATIONAL`, `OUT_OF_SERVICE`, `UNKNOWN`)
  - `page` (integer, default 1)
  - `limit` (integer, default 50, max 100)
- **Query scoping**: Scoped to facilities where `venue.organization_id = :orgId`. Supported by index on `facilities(building_id, operational_status)`.

---

### 4. Organization Maintenance Tasks

- **Endpoint**: `GET /api/v1/organizations/:orgId/maintenance-tasks`
- **Access**: `ORGANIZATION_ADMIN` (for `:orgId`) or `SUPER_ADMIN`.
- **Query params**:
  - `assigneeId` (optional UUID)
  - `status` (optional string, e.g. `PENDING`, `IN_PROGRESS`, `RESOLVED`)
  - `page` (integer, default 1)
  - `limit` (integer, default 50)
- **Query scoping**: Scoped to maintenance tasks where `organization_id = :orgId`.

---

### 5. Facility Status Update & Invalidation

- **Endpoint**: `PATCH /api/v1/facilities/:id/status`
- **Access**: `ORGANIZATION_ADMIN` of the owning organization, or `SUPER_ADMIN`.
- **Body**:
  - `status` (`OPERATIONAL` | `OUT_OF_SERVICE` | `UNKNOWN`, required)
  - `verificationLevel` (`CONFIRMED` | `UNVERIFIED` | `UNAVAILABLE`, optional)
- **Transactional guarantees**:
  1. Row lock via `SELECT ... FOR UPDATE` serializes concurrent status changes on the same facility.
  2. Updates facility operational status, setting `lastVerifiedAt` only when `verificationLevel` is `CONFIRMED` and user is authorized organization admin.
  3. Increments building `graphVersion` inside the same transaction.
  4. Appends audit log row recording actor, entity, previous/new status, and previous/new graph version.
  5. Post-commit: invalidates Redis keys matching `route:v1:${buildingId}:*`, emits event, and broadcasts public status change to WebSocket room `building:${buildingId}`.

---

### 6. Real-Time WebSocket Gateway

- **Namespace**: `/realtime`
- **Transport**: `websocket` only.
- **Handshake Authentication**: Client passes bearer token in `auth.token`. Missing or invalid tokens result in immediate disconnect.
- **Client Messages**:
  - `subscribe:building` with `{ "buildingId": "..." }`: Joins room `building:{buildingId}`. Rate limited per socket.
  - `unsubscribe:building` with `{ "buildingId": "..." }`: Leaves room `building:{buildingId}`.
- **Server Broadcast**:
  - Event: `facility.status.changed` emitted to room `building:{buildingId}`.
  - Payload: `{ facilityId, facilityType, name, buildingId, status, verificationLevel, lastVerifiedAt, graphVersion }`.
  - Privacy guarantee: No report data or sensitive internal metadata is ever broadcast over WebSockets.
