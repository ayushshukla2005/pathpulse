# PathPulse: Spoken Pitch & Technical Walkthrough Scripts

---

## 1. The 60-Second Elevator Pitch

*(Deliver in a conversational, confident tone; approximately 140 words; target duration 55–60 seconds).*

> "Traditional navigation apps stop at the front door. For someone in a wheelchair, arriving at a building only to discover that the elevator is broken or the ramp is blocked means their journey fails completely.
>
> I built PathPulse to solve this. It is an accessibility-first indoor and outdoor navigation platform that routes users across multi-floor buildings based on their specific mobility requirements.
>
> Our core engineering rule is the Verification Principle: the system never infers or guesses that a path is accessible. Routes are only presented as step-free when every intermediate segment is confirmed operational.
>
> Architecturally, my favourite highlight is our zero-race-condition cache invalidation. When an institution logs an elevator outage, we increment the building's graph version inside the same database transaction that updates the facility. Because route cache keys include the graph version, stale cached routes are instantaneously unreachable before the asynchronous Redis purge even finishes. Connected visitors receive the update in real time via WebSockets and are automatically re-routed."

---

## 2. The 3-Minute Technical Walkthrough Script

*(Use this script when an interviewer asks: 'Can you walk me through the architecture of PathPulse and show me the codebase?').*

---

### Step 1: The Problem & Principle (0:00 – 0:25)
- **File to open on screen**: `README.md` (lines 14–25)
- **Spoken script**:
  > "PathPulse bridges the gap between outdoor maps and indoor physical reality. Most platforms treat indoor accessibility as a visual badge. In PathPulse, accessibility is a hard constraint in our routing engine. Our system enforces the Verification Principle: no route is marked accessible unless every corridor, ramp, and elevator along that journey is confirmed step-free and operational."

---

### Step 2: Relational Graph & Spatial Data Model (0:25 – 0:55)
- **File to open on screen**: `apps/api/prisma/schema.prisma` (lines 80–140: `Building`, `Floor`, `MapNode`, `MapEdge`, `Facility`)
- **Spoken script**:
  > "Here is our schema. We chose PostgreSQL 16 with PostGIS over a document store because we need strict transactional integrity across our topological graph. Buildings have integer graph versions. Floors anchor nodes with physical coordinate offsets and geographical points. Edges represent physical connections—corridors, ramps, elevators, and doors—annotated with step-free flags, slope percentages, and verification levels. A database trigger prevents elevator edges from connecting nodes on the same floor."

---

### Step 3: Hard Filtering & Deterministic Dijkstra Routing (0:55 – 1:35)
- **Files to open on screen**:
  1. `apps/api/src/navigation/routing/filter.ts` (`filterGraph`, lines 38–54)
  2. `apps/api/src/navigation/routing/dijkstra.ts` (`findShortestPath`, lines 30–65)
  3. `apps/api/src/navigation/routing/min-heap.ts` (`isHigherPriority`, lines 46–51)
- **Spoken script**:
  > "Before running pathfinding, we pass the graph through `filterGraph`. Here is an intentional design choice: hard physical constraints—such as stairs or broken elevators for a wheelchair profile—are completely removed from the adjacency list rather than penalised with high edge weights. If stairs were merely penalised, Dijkstra would still route a wheelchair over stairs when no other path exists. By pruning them, the engine strictly fails safe with an accessible 'no confirmed route' state.
  >
  > Next, our Dijkstra implementation runs on non-negative weights computed by adding soft penalties for unverified paths and steep slopes. In `min-heap.ts`, our binary min-heap includes a monotonic sequence counter. If two candidate paths have the exact same cost, the tie-breaker enforces strict FIFO determinism."

---

### Step 4: Pure Function State Machine & Separation of Duties (1:35 – 2:05)
- **File to open on screen**: `apps/api/src/reports/workflow/state-machine.ts` (lines 87–155)
- **Spoken script**:
  > "For crowdsourced barrier reports, we designed the moderation workflow as a pure function called `transitionReportState`. Notice there are zero database or ORM imports in this file. It checks an immutable transition matrix against the actor's role.
  >
  > Crucially, lines 128 to 150 enforce separation of duties directly in the business logic: reporters cannot triage, verify, or resolve their own reports. Furthermore, when confirming a resolution, the user who submitted the fix cannot confirm and close it. Keeping this logic pure makes it trivially unit-testable across all edge cases."

---

### Step 5: Row Locking, Atomic Version Bump & Cache Invalidation (2:05 – 2:35)
- **File to open on screen**: `apps/api/src/facilities/facilities.service.ts` (lines 140–280)
- **Spoken script**:
  > "When an administrator updates a facility status, we lock the facility row with `SELECT ... FOR UPDATE` to serialize concurrent requests. Inside the transaction, we update the status, atomically increment the building's `graph_version`, and record an immutable row in `audit_logs`.
  >
  > Our route cache keys are formatted as `route:v1:buildingId:graphVersion:profile:origin:destination`. The moment this transaction commits, the version bump makes old cached routes unreachable. Stale routes are never served, even during a delay in our Redis purge. Once committed, we purge the cache pattern and broadcast the update to connected clients via Socket.IO."

---

### Step 6: Isolated Advisory AI Boundary (2:35 – 2:50)
- **Files to open on screen**:
  1. `apps/api/src/ai/circuit-breaker.ts` (lines 32–58)
  2. `apps/ai-service/app/classifier.py` (lines 80–115)
- **Spoken script**:
  > "We isolated our Python classification service behind an internal HTTP boundary. The core API treats the AI service as untrusted: all calls pass through an Opossum circuit breaker that fast-fails if downstream latency exceeds 500 milliseconds. Every AI suggestion enforces `requiresHumanVerification: true` by schema and database check constraints. The AI advises; humans decide."

---

### Step 7: Testing & Quality Proof (2:50 – 3:00)
- **File to open on screen**: Terminal test output or `README.md` (Section 4)
- **Spoken script**:
  > "Everything is backed by rigorous tests: 173 passing API tests, 67 Web tests including Playwright WCAG 2.2 automated axe scans with zero violations, and 23 tests in our Python AI service. The entire monorepo builds with strict TypeScript and zero lint warnings."
