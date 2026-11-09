# PathPulse: Comprehensive Interviewer Question Bank

This document compiles 12 technical interview questions covering algorithms, data structures, concurrency, distributed caching, security, and systems architecture as implemented in PathPulse. Each answer is written in clear spoken prose (60–120 seconds) with exact source code references and includes a likely interviewer follow-up with its answer.

---

### Question 1: Why did you use a graph data structure for navigation, and why Dijkstra with non-negative weights?

- **Concrete Code Reference**: [`apps/api/src/navigation/routing/dijkstra.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/navigation/routing/dijkstra.ts) & [`apps/api/src/navigation/routing/penalties.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/navigation/routing/penalties.ts)
- **Spoken Answer**:
  > "A building's interior is fundamentally a non-Euclidean topological network. Physical straight lines rarely translate to walkable paths because of walls, security doors, and vertical floor separations. Modeling the space as an adjacency graph allows nodes to represent 3D physical coordinates and edges to encapsulate attributes like step-free availability, door widths, and vertical transport.
  >
  > We chose Dijkstra's algorithm over A* or Floyd-Warshall because indoor floor plans represent single-source shortest path problems with non-uniform, dynamically penalized edge costs. A* requires an admissible and consistent Euclidean distance heuristic; however, in a multi-floor building, an elevator shaft creates zero horizontal distance between floor 0 and floor 3 while spanning 15 vertical meters. Formulating an admissible heuristic across vertical transitions without underestimating complex indoor barriers is non-trivial.
  >
  > Dijkstra provides guaranteed shortest paths with $O((V + E) \log V)$ time complexity using a min-heap. Because all our edge costs—including distance, slope penalties, and unverified multipliers—are clamped to non-negative values using `Math.max(0, cost)` in `penalties.ts`, Dijkstra is mathematically guaranteed to terminate with the optimal path."

- **Follow-up Interviewer May Ask**:
  *“What happens if edge weights could be negative?”*
- **Follow-up Answer**:
  *“Dijkstra fails with negative weights because it assumes once a node is extracted from the priority queue, its shortest distance is finalized. With negative edges, Bellman-Ford would be required, running in $O(V \cdot E)$ time.”*

---

### Question 2: How do hard constraints differ from penalties, and why are excluded edges removed rather than penalized?

- **Concrete Code Reference**: [`apps/api/src/navigation/routing/filter.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/navigation/routing/filter.ts) (lines 38–54)
- **Spoken Answer**:
  > "In PathPulse, we make a fundamental distinction between soft preferences and hard physical constraints.
  >
  > A penalty represents a preference. For example, in `penalties.ts`, we add 500 virtual meters to stairs for ambulatory profiles that prefer ramps, or multiply unverified segment costs by 1.5. A penalty tells the algorithm: 'Avoid this path if a reasonable alternative exists, but take it if it is the only option.'
  >
  > A hard constraint represents physical impossibility or severe safety hazard. For a wheelchair user, taking a staircase or an out-of-service elevator is physically impossible.
  >
  > If we merely applied a huge penalty—say, adding 100,000 meters to a staircase—Dijkstra would still traverse that staircase if no other path existed, because Dijkstra finds the minimum total cost path regardless of how large that cost is. Returning a path containing stairs to a wheelchair user violates our safety contract.
  >
  > By completely removing invalid edges in `filterGraph` before pathfinding starts, we guarantee that Dijkstra will never traverse them. If no valid path exists, the predecessor map fails to reach the destination and our system safely returns an accessible 'no confirmed route' state."

- **Follow-up Interviewer May Ask**:
  *“Doesn't filtering edges upfront add extra CPU overhead to every request?”*
- **Follow-up Answer**:
  *“Filtering takes $O(E)$ linear time to inspect edges and build the filtered map. Since building graphs rarely exceed a few thousand edges, this takes less than 2 milliseconds, which is negligible compared to Dijkstra’s heap operations.”*

---

### Question 3: How does your binary min-heap handle stale entries and ties, and why does tie-breaking matter?

- **Concrete Code Reference**: [`apps/api/src/navigation/routing/min-heap.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/navigation/routing/min-heap.ts) (lines 46–51) & [`apps/api/src/navigation/routing/dijkstra.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/navigation/routing/dijkstra.ts) (lines 44–47)
- **Spoken Answer**:
  > "Standard textbook Dijkstra uses a `decrease-key` operation. However, `decrease-key` in a standard array-backed binary heap requires maintaining an inverted index mapping each item to its heap array index, which adds implementation overhead.
  >
  > Instead, we use the standard industry approach called lazy deletion. Whenever a shorter distance to a neighbor is discovered, we push a new `(neighbor, newDist)` entry into the heap without removing the old one. In `dijkstra.ts`, when an item is popped from the heap, we compare its extracted cost against `dist.get(current)`. If the extracted cost is greater than the recorded distance, it is a stale entry and we skip it.
  >
  > For tie-breaking, our `MinHeap` stores a `sequenceCounter` on every `HeapEntry`. In `isHigherPriority`, if two items have identical priority, the one inserted earlier wins.
  >
  > This tie-breaker is vital for route determinism. In symmetrical indoor spaces—such as two parallel identical corridors—without a FIFO tie-breaker, the heap could extract neighbors in arbitrary order depending on JavaScript engine object hash or array ordering. That would cause identical route requests to return different paths on successive calls. Our tie-breaker ensures 100% repeatable, testable routes."

- **Follow-up Interviewer May Ask**:
  *“How does lazy deletion affect heap memory and time complexity?”*
- **Follow-up Answer**:
  *“Because each edge can insert at most one entry per relaxation, the heap holds at most $E$ entries instead of $V$. The pop time becomes $O(\log E)$, which since $E \le V^2$ is bounded by $O(2 \log V) = O(\log V)$. It has zero asymptotic penalty.”*

---

### Question 4: How does your cache stay consistent after a facility status change? Describe the exact order of operations.

- **Concrete Code Reference**: [`apps/api/src/facilities/facilities.service.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/facilities/facilities.service.ts) (lines 140–280) & [`apps/api/src/navigation/routes.service.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/navigation/routes.service.ts) (lines 24–32)
- **Spoken Answer**:
  > "In high-traffic navigation systems, serving a stale route that directs a visitor to a broken elevator is a safety failure. Simple cache purging via Redis `DEL` is vulnerable to race conditions: if a concurrent request runs Dijkstra before the database update finishes, it can write stale data right back into the cache.
  >
  > We solve this using a dual-layer consistency strategy: monotonic graph versioning combined with post-commit cache purging.
  >
  > Here is the exact order of operations in `updateFacilityStatus`:
  > 1. **Row Lock**: We execute `SELECT ... FOR UPDATE` on the facility row to serialize concurrent writes.
  > 2. **State & Version Mutation**: Inside the database transaction, we update the facility status and atomically increment the building's integer `graph_version`: `UPDATE buildings SET graph_version = graph_version + 1`.
  > 3. **Audit Log Insertion**: An immutable record is inserted into `audit_logs` in that same transaction.
  > 4. **Database Commit**: The transaction commits atomically.
  >
  > Because route cache keys are formatted as `route:v1:buildingId:graphVersion:profile:origin:dest`, the moment the transaction commits, all new route queries immediately fetch the incremented `graphVersion`. They look up a brand-new cache key. Stale cached routes for the old version can never be matched.
  >
  > 5. **Post-Commit Redis Purge**: Only after the commit succeeds, we purge legacy keys using `redis.deleteByPattern`. If Redis temporarily fails, correctness is still maintained because the old version is unreachable.
  > 6. **Broadcast**: Finally, we emit a WebSocket event to `building:${buildingId}` room so connected clients can re-route."

- **Follow-up Interviewer May Ask**:
  *“Why not broadcast the WebSocket event inside the database transaction?”*
- **Follow-up Answer**:
  *“Broadcasting before commit creates phantom events: if the database transaction subsequently rolls back due to a constraint violation, external clients would have already acted on an uncommitted state.”*

---

### Question 5: How do you prevent two moderators from updating or acting on the same report simultaneously?

- **Concrete Code Reference**: [`apps/api/src/facilities/facilities.service.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/facilities/facilities.service.ts) (lines 140–145) & [`apps/api/src/reports/workflow/workflow.service.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/reports/workflow/workflow.service.ts)
- **Spoken Answer**:
  > "If two moderators open the same barrier report at the same time and attempt contradictory status updates—such as one verifying while the other rejects—a naive read-then-write pattern causes a classic lost update race condition.
  >
  > We prevent this using pessimistic concurrency control via PostgreSQL row-level locks.
  >
  > When a moderation action begins inside a Prisma transaction, we issue a raw query with `SELECT id, status, ... FROM issue_reports WHERE id = $1 FOR UPDATE`.
  >
  > In PostgreSQL, `FOR UPDATE` acquires an exclusive lock on that specific tuple. If Moderator B attempts a transition on the same report while Moderator A's transaction is active, Moderator B's database query blocks until Moderator A's transaction either commits or rolls back.
  >
  > Once Moderator A commits, Moderator B's query unblocks and reads the freshly committed status. When Moderator B's code passes that new status into our pure `transitionReportState` machine, the machine rejects the transition with `INVALID_TRANSITION` because the report is no longer in its original state.
  >
  > This guarantees serialized, conflict-free state changes without application-level distributed locks."

- **Follow-up Interviewer May Ask**:
  *“When would you use optimistic concurrency control with a version column instead of pessimistic row locking?”*
- **Follow-up Answer**:
  *“Optimistic locking with an `UPDATE ... WHERE version = x` clause is preferable when contention is low and transactions are read-heavy. In moderation workflows with immediate user clicks and high concurrent dispute probability, pessimistic locking prevents wasted CPU and rollbacks.”*

---

### Question 6: How is the audit log protected, and what does the database trigger do that permission revocation does not?

- **Concrete Code Reference**: [`apps/api/prisma/migrations/20261108000008_make_audit_logs_append_only/migration.sql`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/prisma/migrations/20261108000008_make_audit_logs_append_only/migration.sql)
- **Spoken Answer**:
  > "In PathPulse, `audit_logs` is the authoritative record for physical facility outages and safety reports. If an audit log could be updated or deleted, an attacker or disgruntled employee could alter records to conceal neglect or liability.
  >
  > We implemented defense-in-depth using two complementary mechanisms:
  >
  > First, SQL table permissions: `REVOKE UPDATE, DELETE ON TABLE audit_logs FROM pathpulse`. This strips update and delete privileges from the application database role.
  >
  > However, permission revocation alone has gaps:
  > 1. In development, testing, or maintenance environments, connection pools frequently run as the database owner or superuser, which bypasses table grants.
  > 2. An ORM migration or administrative script could inadvertently execute a cascade delete.
  >
  > To close this gap, we created a PostgreSQL `BEFORE UPDATE OR DELETE` row-level trigger called `trg_prevent_audit_logs_modification`.
  >
  > The trigger function unconditionally executes `RAISE EXCEPTION 'audit_logs is an append-only table. UPDATE and DELETE operations are forbidden.'`.
  >
  > Even if a query is executed by the table owner or superuser, PostgreSQL evaluates the trigger before touching the row and aborts the transaction immediately. The only way to bypass the trigger is to explicitly alter or drop the trigger itself, which requires DDL superuser rights and generates external database engine audit logs."

- **Follow-up Interviewer May Ask**:
  *“How do you handle audit log table growth over time if you can never run DELETE?”*
- **Follow-up Answer**:
  *“We use PostgreSQL declarative table partitioning by timestamp (e.g. monthly partitions). To archive data older than our legal retention policy, we detach and export the partition to cold S3 storage without ever executing a row-level DELETE.”*

---

### Question 7: Explain Separation of Duties in your moderation workflow: how are self-verification and self-confirmation blocked, and where does that check live?

- **Concrete Code Reference**: [`apps/api/src/reports/workflow/state-machine.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/reports/workflow/state-machine.ts) (lines 128–150)
- **Spoken Answer**:
  > "Separation of duties prevents conflicts of interest and fraudulent resolutions. In crowdsourced accessibility reporting, there are two major integrity risks:
  > 1. A user submitting a report and immediately verifying or resolving it themselves to manipulate metrics or falsely claim a route is blocked.
  > 2. A maintenance person who submitted a resolution being able to confirm and close their own fix without independent verification.
  >
  > We enforce this directly in our pure `transitionReportState` function, not solely in controller guards.
  >
  > In `state-machine.ts`:
  > - Lines 128 to 136 check: If the action is `VERIFY`, `ASSIGN`, or `SUBMIT_RESOLUTION`, and `actorId === facts.reporterId`, the transition is rejected with `SELF_ACTION_FORBIDDEN`.
  > - Lines 138 to 150 check `CONFIRM_RESOLUTION`: First, the original reporter cannot close it (`SELF_ACTION_FORBIDDEN`). Second, if `actorId === facts.resolutionSubmittedByUserId`, the transition is rejected with `SEPARATION_OF_DUTIES`.
  >
  > Because these rules are baked into the pure transition function, it is impossible for an API route, background job, or CLI script to bypass them. It requires two distinct human actors to bring any reported obstacle from submission to verified closure."

- **Follow-up Interviewer May Ask**:
  *“What if the organisation is small and has only one administrator?”*
- **Follow-up Answer**:
  *“The system design strictly separates the `ORGANIZATION_ADMIN` role (who submits maintenance fixes) from the platform `MODERATOR` role (who verifies and confirms closures). Platform integrity takes precedence over convenience.”*

---

### Question 8: Why are presigned S3 URLs safer than proxying upload streams through the backend API, and how do you verify the upload?

- **Concrete Code Reference**: [`apps/api/src/reports/storage.service.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/reports/storage.service.ts) (lines 47–92) & [`apps/api/src/reports/__tests__/evidence-verification.spec.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/reports/__tests__/evidence-verification.spec.ts)
- **Spoken Answer**:
  > "Streaming photographic evidence through the backend API creates three major architectural hazards:
  > 1. **Resource Exhaustion**: Buffering or proxying 10MB image uploads ties up Node.js event loop threads, saturates server network bandwidth, and increases RAM consumption, opening the door to Denial of Service attacks.
  > 2. **Attack Surface**: The backend server is exposed to multipart parsing exploits, buffer overflows, and temporary disk exhaustion.
  > 3. **Latency**: The file must be transmitted twice—first from client to API, and then from API to S3.
  >
  > We solve this using the direct-to-S3 presigned PUT URL pattern.
  >
  > In `storage.service.ts`, the client requests an upload ticket. The server generates a signed URL using `@aws-sdk/s3-request-presigner` with:
  > - A unique UUID object key
  > - An exact content length constraint
  > - An exact MIME type constraint (`image/jpeg`, `image/png`, `image/webp`)
  > - A short 15-minute expiration
  >
  > The client uploads binary bytes directly to S3.
  >
  > Crucially, obtaining a presigned URL is not proof of upload. When the client calls `POST /reports` with the object key, the API executes `storageService.headObject(key)`. This sends an S3 `HeadObjectCommand` that verifies the object genuinely exists in the bucket, its byte size is non-zero and within limits, and its Content-Type matches the signed policy before the evidence row is committed to PostgreSQL."

- **Follow-up Interviewer May Ask**:
  *“What happens to orphan files in S3 if the client uploads the photo but never submits the report?”*
- **Follow-up Answer**:
  *“We configure an S3 bucket lifecycle policy that automatically deletes unconfirmed objects in the `uploads/` prefix that are older than 24 hours.”*

---

### Question 9: Why is the AI service advisory-only, and what does the circuit breaker do when the AI service fails?

- **Concrete Code Reference**: [`apps/api/src/ai/circuit-breaker.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/ai/circuit-breaker.ts) & [`apps/ai-service/app/schemas.py`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/ai-service/app/schemas.py)
- **Spoken Answer**:
  > "PathPulse deals with physical human accessibility and campus safety. If an AI model hallucinated or made an incorrect classification—for instance, classifying a blocked fire exit or broken wheelchair lift as cosmetic damage and auto-closing it—someone in a wheelchair could be trapped or stranded.
  >
  > Therefore, our AI service is advisory-only by design. Every response from our Python FastAPI service enforces `requiresHumanVerification: true` at three levels:
  > 1. In Pydantic schemas in Python
  > 2. In TypeScript DTO validators in the API
  > 3. In a PostgreSQL check constraint on the `ai_suggestions` table (`CHECK (requires_human_verification = true)`).
  >
  > Furthermore, machine learning inference is unpredictable in latency and memory. We isolate it behind a custom `CircuitBreaker` in `apps/api/src/ai/circuit-breaker.ts`.
  >
  > The breaker starts in `CLOSED` state. All downstream calls have a 500ms timeout. If 3 consecutive requests fail or time out, the breaker trips to `OPEN`.
  >
  > In `OPEN` state, the API fast-fails downstream requests immediately without making network calls, saving threads. After 10 seconds, it transitions to `HALF_OPEN`, allowing a single trial request. If that succeeds, the breaker resets to `CLOSED`; if it fails, it returns to `OPEN`.
  >
  > Most importantly: when the circuit breaker is OPEN, report creation, evidence upload, and human moderation continue working seamlessly. AI suggestions are simply omitted."

- **Follow-up Interviewer May Ask**:
  *“Why build a custom circuit breaker instead of using an existing library?”*
- **Follow-up Answer**:
  *“Building an in-house, zero-dependency circuit breaker class allows exact control over state transitions (`CLOSED`, `OPEN`, `HALF_OPEN`), deterministic unit testing with fake timers, and zero supply-chain risk.”*

---

### Question 10: How are WebSocket connections authenticated, and why are subscriptions authorized per building?

- **Concrete Code Reference**: [`apps/api/src/realtime/realtime.gateway.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/realtime/realtime.gateway.ts) (lines 43–117)
- **Spoken Answer**:
  > "In real-time navigation, broadcasting facility updates to thousands of connected clients must be secure and bandwidth-efficient.
  >
  > In `realtime.gateway.ts`, authentication occurs at handshake time in `handleConnection`. The gateway extracts the JWT Bearer token from `client.handshake.auth.token` or the `Authorization` header. It verifies the signature with `jwtService.verifyAsync` using our application secret. If missing or invalid, the socket receives an error event and is disconnected immediately.
  >
  > Once authenticated, we do not broadcast status changes globally to all connected users. That would cause massive network amplification: a user navigating in Building A does not care about an elevator outage in Building B across the city.
  >
  > Instead, clients subscribe to specific rooms using `subscribe:building`.
  >
  > Before joining the client to `building:${buildingId}`, the gateway:
  > 1. Enforces an in-memory rate limit (maximum 10 subscription changes per 10 seconds per socket) to prevent subscription flooding.
  > 2. Verifies that the target `buildingId` actually exists in the database.
  >
  > When a facility status update occurs, `broadcastFacilityStatus` emits only to `building:${buildingId}` room. This limits network fan-out strictly to clients actively navigating in that physical building."

- **Follow-up Interviewer May Ask**:
  *“What happens if the API is scaled to multiple container instances?”*
- **Follow-up Answer**:
  *“In a multi-node deployment, we plug in `@socket.io/redis-adapter`. Socket.IO publishes events across the Redis pub/sub channel, ensuring clients connected to different API replicas in the same building room all receive the broadcast.”*

---

### Question 11: How would you scale PathPulse to handle one million active users?

- **Concrete Code Reference**: [`apps/api/src/navigation/graph/graph-loader.service.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/navigation/graph/graph-loader.service.ts), [`apps/api/src/cache/redis.service.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/cache/redis.service.ts)
- **Spoken Answer**:
  > "To scale PathPulse from hundreds of institutional users to one million daily active users, we address four distinct bottlenecks:
  >
  > 1. **Routing Compute & Memory (The Graph Loader)**:
  > Currently, `GraphLoaderService` queries PostgreSQL for nodes and edges. For one million users, repeated graph loading would saturate the database. We would cache the compiled adjacency topology of each building in Redis or in-process LRU cache keyed by `buildingId:graphVersion`. Dijkstra then executes purely in application memory without touching the database.
  >
  > 2. **Database Read Scalability**:
  > 95% of traffic is read-only (venue exploration, floor plans, and route queries). We introduce PostgreSQL read replicas behind PgBouncer connection pooling. Primary handles facility updates, report submissions, and transactions; replicas handle read queries.
  >
  > 3. **Route Caching Strategy**:
  > Because route queries between common origin-destination pairs (e.g. Entrance to Cafeteria) exhibit high locality, our Redis cache absorbs the vast majority of repeated Dijkstra computations. With 1M users, we shard Redis using Redis Cluster and compress cached route JSON payloads.
  >
  > 4. **Real-time WebSockets**:
  > One million concurrent WebSockets cannot live on a single Node.js process due to file descriptor and memory limits (~10,000 to 20,000 sockets per process). We deploy a dedicated WebSocket gateway cluster using `@socket.io/redis-adapter` running behind an AWS Application Load Balancer with sticky sessions."

- **Follow-up Interviewer May Ask**:
  *“How would you handle the Dijkstra execution time for a massive airport with 50,000 nodes?”*
- **Follow-up Answer**:
  *“For massive graphs, standard Dijkstra is too slow. We would pre-compute Contraction Hierarchies (CH) or transit-node routing, reducing multi-floor queries across 50,000 nodes from hundreds of milliseconds to sub-5 milliseconds.”*

---

### Question 12: What would you do differently with more time?

- **Concrete Code Reference**: [`apps/web/app/(app)/buildings/[id]/floors/[floorId]/page.tsx`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/web/app/(app)/buildings/[id]/floors/[floorId]/page.tsx) & [`apps/ai-service/evaluation/results.txt`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/ai-service/evaluation/results.txt)
- **Spoken Answer**:
  > "If I had another two months on PathPulse, I would focus on three specific engineering enhancements:
  >
  > 1. **Computer Vision Evidence Verification**:
  > Right now, our Python AI service classifies the text description using TF-IDF and Logistic Regression. In our evaluation results in `results.txt`, the classifier achieved 91.7% accuracy, but `OTHER` had a 66.7% recall because text alone like 'handrail is loose' confused the ramp keyword detector. I would introduce a lightweight Vision Transformer (ViT) or fine-tuned MobileNet model in the AI service to inspect the uploaded image and verify whether an image actually shows a physical barrier or an irrelevant photo.
  >
  > 2. **Indoor Positioning System (IPS) via BLE Beacons**:
  > PathPulse computes static turn-by-turn routes. In production, indoor GPS does not work. I would integrate Bluetooth Low Energy (BLE) beacon trilateration or Wi-Fi RTT into the client to show live 'blue dot' real-time navigation as the user moves between corridors.
  >
  > 3. **Offline-First Vector Tile Caching**:
  > In deep basements or rural medical centers, cellular connectivity drops. I would implement an offline SQLite database via WebAssembly on the client, caching the building's graph so Dijkstra can run completely client-side in offline airplane mode when network connectivity is lost."

- **Follow-up Interviewer May Ask**:
  *“Why didn’t you use client-side Dijkstra originally?”*
- **Follow-up Answer**:
  *“Our Verification Principle requires that routes reflect real-time facility operational states and recent barrier reports. Running on the server guarantees the user’s route is verified against the latest database state.”*
