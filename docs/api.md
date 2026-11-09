# PathPulse REST & WebSocket API Specification

This document provides the exhaustive API reference for PathPulse, detailing route patterns, HTTP methods, authorization scopes, request payloads, response schemas, and error codes.

---

## 1. System Health & Readiness

### 1.1 Liveness Probe
- **Endpoint**: `GET /api/v1/health`
- **Access**: Public
- **Description**: Returns basic application and database status without exposing credentials or internal IP addresses.
- **Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "database": "connected",
    "redis": "ok",
    "uptime": 12450.2,
    "version": "0.1.0"
  }
  ```

### 1.2 Deep Readiness Probe
- **Endpoint**: `GET /api/v1/health/ready`
- **Access**: Public
- **Description**: Verifies database connectivity and verifies that all on-disk Prisma migrations have been successfully applied to `_prisma_migrations`.
- **Response (200 OK)**:
  ```json
  {
    "status": "ready"
  }
  ```
- **Error Response (503 Service Unavailable)**:
  ```json
  {
    "status": "not_ready",
    "reason": "pending_migrations",
    "pendingCount": 1
  }
  ```

---

## 2. Authentication & User Profile

### 2.1 User Registration
- **Endpoint**: `POST /api/v1/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123!",
    "name": "Jane Doe"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "user": {
      "id": "usr_cuid123",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "REPORTER"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
  ```

### 2.2 User Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response (200 OK)**: Returns user object and token bundle.

### 2.3 Token Refresh
- **Endpoint**: `POST /api/v1/auth/refresh`
- **Access**: Public (requires valid Bearer refresh token or body `refreshToken`)
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
- **Response (200 OK)**: Returns fresh `accessToken` and `refreshToken`.

### 2.4 User Logout
- **Endpoint**: `POST /api/v1/auth/logout`
- **Access**: Authenticated
- **Response (204 No Content)**: Invalidates refresh token session.

### 2.5 Current Profile & Preferences
- **Endpoint**: `GET /api/v1/auth/me`
- **Access**: Authenticated
- **Response (200 OK)**:
  ```json
  {
    "id": "usr_cuid123",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "REPORTER",
    "mobilityProfile": "WHEELCHAIR",
    "avoidStairs": true,
    "requireElevators": true,
    "maxSlopeDegrees": 5.0
  }
  ```

- **Update Preferences**: `PATCH /api/v1/users/preferences`
- **Request Body**:
  ```json
  {
    "mobilityProfile": "WHEELCHAIR",
    "avoidStairs": true,
    "requireElevators": true,
    "maxSlopeDegrees": 4.5
  }
  ```

---

## 3. Venues, Buildings & Graph Topology

### 3.1 List Venues
- **Endpoint**: `GET /api/v1/venues`
- **Access**: Public
- **Query Params**: `lat`, `lng`, `radiusKm`, `search`, `category`
- **Response (200 OK)**: Array of venue summaries with computed distance and accessibility tags.

### 3.2 Get Venue Detail
- **Endpoint**: `GET /api/v1/venues/:id`
- **Access**: Public
- **Response (200 OK)**: Full venue details including associated buildings and outdoor connectivity.

### 3.3 Get Building Detail & Floors
- **Endpoint**: `GET /api/v1/buildings/:id`
- **Access**: Public
- **Response (200 OK)**: Building information, `graphVersion`, and array of floors.

### 3.4 Floor Graph
- **Endpoint**: `GET /api/v1/buildings/:id/floors/:floorId/graph`
- **Access**: Public
- **Response (200 OK)**:
  ```json
  {
    "floorId": "flr_ground",
    "level": 0,
    "nodes": [
      { "id": "node_1", "label": "Main Entrance", "x": 10.5, "y": 20.2, "isAccessible": true }
    ],
    "edges": [
      { "id": "edge_1", "source": "node_1", "target": "node_2", "distanceMeters": 15.2, "isStepFree": true, "confidence": "CONFIRMED" }
    ]
  }
  ```

---

## 4. Navigation & Route Planning

### 4.1 Plan Multi-Floor Route
- **Endpoint**: `POST /api/v1/navigation/route`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "buildingId": "bld_main",
    "originNodeId": "node_entrance",
    "destinationNodeId": "node_room_204",
    "mobilityProfile": "WHEELCHAIR"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "routeId": "rt_computed_cuid",
    "buildingId": "bld_main",
    "graphVersion": 4,
    "isStepFree": true,
    "totalDistanceMeters": 142.5,
    "estimatedDurationSeconds": 180,
    "segments": [
      {
        "floorLevel": 0,
        "instructions": "Proceed straight toward Central Elevator A",
        "distanceMeters": 45.0,
        "isStepFree": true,
        "confidence": "CONFIRMED"
      },
      {
        "floorLevel": 2,
        "instructions": "Exit elevator, turn left toward Room 204",
        "distanceMeters": 97.5,
        "isStepFree": true,
        "confidence": "CONFIRMED"
      }
    ],
    "alternativeRoutes": []
  }
  ```

---

## 5. Facilities & Real-Time Status

### 5.1 List Facilities
- **Endpoint**: `GET /api/v1/facilities`
- **Access**: Public
- **Query Params**: `buildingId`, `floorId`, `type`, `status`

### 5.2 Update Facility Status
- **Endpoint**: `PATCH /api/v1/facilities/:id/status`
- **Access**: `ORGANIZATION_ADMIN`, `MODERATOR`, `SUPER_ADMIN`
- **Request Body**:
  ```json
  {
    "operationalStatus": "OUT_OF_SERVICE",
    "verificationLevel": "CONFIRMED",
    "reason": "Scheduled hydraulic cable replacement"
  }
  ```
- **Response (200 OK)**: Returns updated facility record with new building `graphVersion`.

---

## 6. Reports, Evidence & Moderation Workflow

### 6.1 Presigned Upload URL Request
- **Endpoint**: `POST /api/v1/reports/presigned-url`
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "contentType": "image/jpeg",
    "fileSizeBytes": 2048500
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "uploadUrl": "https://s3.amazonaws.com/pathpulse-evidence/uploads/cuid.jpg?X-Amz-...",
    "objectKey": "uploads/cuid.jpg",
    "expiresInSeconds": 900
  }
  ```

### 6.2 Submit Barrier Report
- **Endpoint**: `POST /api/v1/reports`
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "venueId": "ven_cuid123",
    "buildingId": "bld_main",
    "description": "Wheelchair ramp at South Entrance is blocked by construction scaffolding",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "objectKeys": ["uploads/cuid.jpg"]
  }
  ```
- **Response (201 Created)**: Returns created report in `SUBMITTED` status with tracking ID.

### 6.3 Transition Report Status
- **Endpoint**: `POST /api/v1/reports/:id/transition`
- **Access**: `MODERATOR`, `ORGANIZATION_ADMIN`, `SUPER_ADMIN`
- **Request Body**:
  ```json
  {
    "targetStatus": "IN_PROGRESS",
    "assignedToUserId": "usr_staff1",
    "note": "Assigned to facilities maintenance crew"
  }
  ```
- **Response (200 OK)**: Returns updated report and writes to `audit_logs`.

---

## 7. Organization Dashboard & Analytics

### 7.1 Organization Dashboard Metrics
- **Endpoint**: `GET /api/v1/organizations/:orgId/dashboard`
- **Access**: `ORGANIZATION_ADMIN`, `SUPER_ADMIN` (scoped to organization membership)
- **Response (200 OK)**:
  ```json
  {
    "verifiedRouteCoverage": 94.2,
    "pendingIssues": 7,
    "verifiedFacilities": 48,
    "resolvedReports": 19,
    "generatedAt": "2026-11-09T23:45:00.000Z"
  }
  ```

---

## 8. Public Feedback

### 8.1 Submit Feedback
- **Endpoint**: `POST /api/v1/feedback`
- **Access**: Public (rate limited to 5 submissions/min)
- **Request Body**:
  ```json
  {
    "category": "ACCESSIBILITY",
    "message": "Screen reader focus was skipped on the floor selector.",
    "email": "user@domain.com",
    "website": ""
  }
  ```
- **Response (201 Created)**: `{"status":"received"}`.

---

## 9. AI Advisory Service (FastAPI Internal)

### 9.1 Liveness Probe
- **Endpoint**: `GET /health`
- **Access**: Internal
- **Response (200 OK)**: `{"status":"ok","version":"pathpulse-classifier-v1.0.0"}`

### 9.2 Classify Barrier Report
- **Endpoint**: `POST /v1/classify`
- **Headers**: `Authorization: Bearer <AI_SERVICE_TOKEN>`
- **Request Body**:
  ```json
  {
    "description": "Passenger elevator is jammed between floors",
    "imageHint": null
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "category": "BROKEN_LIFT",
    "severity": "HIGH",
    "confidence": 0.94,
    "requiresHumanVerification": true,
    "modelVersion": "pathpulse-classifier-v1.0.0"
  }
  ```
