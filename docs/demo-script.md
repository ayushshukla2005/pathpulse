# PathPulse: 3-Minute Walkthrough Demo Script

This script provides an interactive demonstration walkthrough of PathPulse, showcasing the end-to-end user experience across public accessibility, route planning, crowdsourced reporting, AI advisory moderation, and real-time facility status invalidation.

---

## 1. Demo Credentials & Environment

| Role | Email | Password | Scope / Permissions |
| :--- | :--- | :--- | :--- |
| **Organization Admin** | `demo-admin@pathpulse.local` | `DemoAdmin123!` (or value of `SEED_ADMIN_PASSWORD`) | Full admin rights for "Sample Campus" organization |
| **Community Reporter** | `demo-reporter@pathpulse.local` | `DemoUser123!` (can register new) | Submits barrier reports & views own tracking IDs |

---

## 2. Walkthrough Sequence (Total Time: 3:00)

### Segment 1: Public Experience & WCAG 2.2 Accessibility (0:00 – 0:35)
- **URL**: `http://localhost:3000/` &rarr; `http://localhost:3000/accessibility`
- **Actions**:
  1. Open homepage. Highlight the skip-to-content link using `Tab` key.
  2. Notice the high-contrast focus indicators (`#005a9c`) and clear semantic structure.
  3. Navigate to `/accessibility` and `/privacy`.
- **Narration**:
  > *"Welcome to PathPulse, an accessibility-first multi-floor navigation platform. Every page is built to WCAG 2.2 AA standards with native keyboard navigation, screen reader live regions, and clear, factual accessibility disclosures compliant with India's RPwD Act 2016."*

---

### Segment 2: Accessible Multi-Floor Route Planning (0:35 – 1:15)
- **URL**: `http://localhost:3000/explore` &rarr; `http://localhost:3000/venues` &rarr; Route Planner
- **Actions**:
  1. Open "Central Campus (Demo)", select "Science & Tech Building".
  2. Select Origin: *Main Ground Floor Entrance*.
  3. Select Destination: *Room 204 (2nd Floor)*.
  4. Select Mobility Profile: `Wheelchair (Step-Free)`.
  5. Click **Find Route**. Observe the multi-floor route visualization and floor-by-floor step instructions.
  6. Point out that every segment explicitly states confidence (`Confirmed`), not color alone.
- **Narration**:
  > *"Here we plan a journey across multiple floors. The PathPulse routing engine never guesses safety on the client: routes are only labeled accessible when confirmed step-free across all elevators and corridors. Floor transitions clearly show vertical navigation via confirmed operational lifts."*

---

### Segment 3: Crowdsourced Barrier Reporting & Presigned S3 Upload (1:15 – 1:55)
- **URL**: `http://localhost:3000/reports/new`
- **Actions**:
  1. Log in as `demo-reporter@pathpulse.local`.
  2. Click **Report an Obstacle**.
  3. Select Venue: *Central Campus*, Building: *Science & Tech Building*.
  4. Description: *"Temporary maintenance scaffolding blocks the South Entrance ramp."*
  5. Attach a photo. Notice how the browser uploads directly to S3 storage via a presigned URL without passing file bytes through our API.
  6. Submit report. Show the newly generated tracking ID and `SUBMITTED` status.
- **Narration**:
  > *"When a user encounters a broken lift or blocked ramp, they can report it immediately. Photo evidence streams directly to secure S3 storage through short-lived presigned URLs. The server confirms the upload without ever buffering heavy image bytes on the API server."*

---

### Segment 4: AI Advisory Suggestions & Moderator Verification (1:55 – 2:30)
- **URL**: `http://localhost:3000/organization`
- **Actions**:
  1. Switch login to `demo-admin@pathpulse.local`.
  2. Open the Organization Dashboard. Highlight the SQL-aggregated metrics: *Verified Route Coverage*, *Pending Issues*, and *Active Facilities*.
  3. Open the newly submitted barrier report.
  4. Show the AI Advisory section: category suggested as `BLOCKED_RAMP` with confidence score.
  5. Emphasize that the AI suggestion carries `requiresHumanVerification: true` and cannot alter the report status on its own.
  6. Transition report to `IN_PROGRESS` and assign to maintenance.
- **Narration**:
  > *"Institutional administrators have an organization-scoped dashboard computed via database aggregations. Our Python AI service assists triage by classifying barriers and checking for duplicates. Crucially, the AI is advisory-only: human moderators retain full decision authority."*

---

### Segment 5: Real-Time Facility Invalidation & Dynamic Re-Routing (2:30 – 3:00)
- **URL**: Route Planner & Admin Facility Controls
- **Actions**:
  1. In the admin facility controls, toggle Elevator A status to `OUT_OF_SERVICE`.
  2. Instantly, the building `graphVersion` bumps atomically in the database transaction and Redis caches are purged.
  3. Open the Route Planner in another window: the route immediately re-computes avoiding Elevator A and reroutes via the West Accessible Lift or displays the accessible 'no confirmed route' state.
- **Narration**:
  > *"The moment an elevator outage is recorded, PathPulse atomically increments the building's graph version and broadcasts a real-time WebSocket event. Cached routes are immediately invalidated, ensuring no user is ever directed to an inoperable lift. PathPulse makes institutional spaces navigable, verifiable, and inclusive."*
