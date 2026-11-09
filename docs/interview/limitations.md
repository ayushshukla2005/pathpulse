# PathPulse: Honest Technical Limitations & Weaknesses

In senior engineering interviews, demonstrating self-awareness and identifying real, evidence-backed architectural trade-offs is more impressive than claiming a system is flawless. This document details six genuine limitations in PathPulse, citing exact source files and evaluation results, explaining their operational impact, and specifying how they would be solved in production.

---

### Limitation 1: Image Evidence Verification Checks Headers, Not Pixels (No Computer Vision)

- **What It Is**:
  When users attach photo evidence to a barrier report, the server verifies file presence, MIME type (`image/jpeg`, `image/png`, `image/webp`), and file size via an S3 `HeadObjectCommand`. It does not analyze the pixel contents of the image.
- **Concrete Code Evidence**:
  [`apps/api/src/reports/storage.service.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/reports/storage.service.ts) (lines 76–92):
  ```typescript
  async headObject(objectKey: string): Promise<{ contentLength: number; contentType: string } | null>
  ```
- **Why It Matters**:
  A malicious or trolling user could upload a valid 2MB JPEG of a cat, a meme, or a solid black square. The server accepts it as verified evidence because the S3 headers and magic bytes match an image. Human moderators must still look at the image manually to catch spam.
- **How to Fix in Production**:
  Introduce an asynchronous image verification worker using a lightweight Vision-Language Model (VLM) or object detection model (e.g. YOLOv11 or MobileNet) running in `apps/ai-service`. The worker validates whether the image contains physical indoor structures (doors, elevators, corridors, ramps) and computes an `is_relevant_barrier_photo` confidence score before marking the evidence as verified.

---

### Limitation 2: Classifier Recall on `OTHER` Category is 66.7% Due to Keyword Overlap

- **What It Is**:
  In our held-out test evaluation, the AI text classifier achieved an overall accuracy of 91.7%, but recall for the `OTHER` category dropped to 66.7% (2 out of 3 samples).
- **Concrete Evaluation Evidence**:
  [`apps/ai-service/evaluation/results.txt`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/ai-service/evaluation/results.txt) (lines 12, 23, and 27):
  ```text
  OTHER                 precision: 1.000   recall: 0.667   f1-score: 0.800   support: 3
  Confusion Matrix: OTHER row: [0, 1, 0, 2]
  [FAIL] id=syn-35 actual=OTHER pred=BLOCKED_RAMP conf=0.33 text="Handrail along the corridor access walkway is loose and wigg..."
  ```
- **Why It Matters**:
  The report described a loose handrail along a walkway (`OTHER`). Because the rule heuristics in `KEYWORD_CATEGORY_RULES` matched `walkway` / `slope` patterns, the hybrid fallback misclassified it as `BLOCKED_RAMP` with low confidence (0.33).
- **How to Fix in Production**:
  The training dataset is small (40 synthetic samples). We would expand the training corpus with at least 500 real-world facilities management tickets, remove generic spatial keywords like `walkway` from category-specific heuristics, and replace TF-IDF with a compact fine-tuned domain sentence embedding model (e.g. `all-MiniLM-L6-v2`).

---

### Limitation 3: Duplicate Report Detection Relies on Word Token Jaccard, Not Semantic Embeddings

- **What It Is**:
  Duplicate report scoring uses n-gram token overlap (Jaccard and character n-gram matching) rather than dense vector semantic embeddings.
- **Concrete Code Evidence**:
  [`apps/ai-service/app/duplicates.py`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/ai-service/app/duplicates.py) (lines 25–45):
  ```python
  def compute_duplicate_scores(candidate_description, comparison_reports, threshold=0.65)
  ```
- **Why It Matters**:
  Token overlap works well when users use similar vocabulary (e.g. "elevator broken" and "elevator out of service"). However, if User A writes *"The lift is stuck on level 3"* and User B writes *"Vertical hoist carriage jammed on floor three"*, the lexical Jaccard similarity is near zero despite describing the exact same barrier.
- **How to Fix in Production**:
  Store 384-dimensional dense vector embeddings of report descriptions in PostgreSQL using `pgvector`. When a new report is submitted, perform an approximate nearest neighbor cosine similarity query (`<=>`) within a 50-meter spatial radius (`ST_DWithin`).

---

### Limitation 4: WebSocket Rate Limiting Uses In-Memory Map (Not Distributed)

- **What It Is**:
  In `RealtimeGateway`, the rate limiter preventing subscription spam uses a local in-memory JavaScript `Map<string, number[]>` storing timestamps per socket connection.
- **Concrete Code Evidence**:
  [`apps/api/src/realtime/realtime.gateway.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/realtime/realtime.gateway.ts) (lines 35, 91–99):
  ```typescript
  private readonly rateLimits = new Map<string, number[]>();
  ```
- **Why It Matters**:
  When scaling the backend API horizontally across multiple container replicas or instances behind a load balancer, each process tracks rate limits independently. A client can reconnect or rotate sockets across replicas to bypass the 10-subscription limit. Furthermore, disconnecting and reconnecting clears the in-memory map.
- **How to Fix in Production**:
  Replace the in-memory `Map` with a distributed sliding-window rate limiter in Redis using sorted sets (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`) keyed by the authenticated user's ID (`ratelimit:ws:${userId}`), ensuring rate limits persist across socket reconnects and multiple container replicas.

---

### Limitation 5: Route Cache Key Lacks Profile Version & Penalty Weights

- **What It Is**:
  The Redis route cache key incorporates `buildingId`, `graphVersion`, `profile`, `originNodeId`, and `destinationNodeId`, but uses a hardcoded static `route:v1` prefix without tracking algorithm penalty versioning.
- **Concrete Code Evidence**:
  [`apps/api/src/navigation/routes.service.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/navigation/routes.service.ts) (lines 30–32):
  ```typescript
  return `route:v1:${buildingId}:${graphVersion}:${profile}:${originNodeId}:${destinationNodeId}`;
  ```
- **Why It Matters**:
  If an engineer adjusts the slope penalty multiplier in `penalties.ts` (e.g. changing `slopePenaltyPerPercentMeters` from 10 to 15), existing cached routes in Redis remain valid for up to 24 hours (their TTL) because the building's database `graph_version` did not change. Users receive routes calculated with old algorithmic weights until the cache expires or Redis is flushed.
- **How to Fix in Production**:
  Include an algorithm configuration hash or version constant in the key format:
  `route:v2:algo-1.2:${buildingId}:${graphVersion}:${profile}:${origin}:${dest}`. Updating the algorithm constant instantly and gracefully invalidates all previous route caches.

---

### Limitation 6: Seeded Demo Graph is Minimal (4 Nodes, 3 Edges)

- **What It Is**:
  The checked-in database seed script populates a single sample building ("Science & Tech Building") with 2 floors, 4 map nodes, and 3 edges.
- **Concrete Code Evidence**:
  [`apps/api/prisma/seed.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/prisma/seed.ts) (lines 140–280)
- **Why It Matters**:
  While sufficient for unit tests and simple functional walkthroughs, this 4-node topology cannot demonstrate complex routing behaviors such as competing multi-elevator banks, complex multi-wing detours, or large-scale Dijkstra heap stress testing in a live demo.
- **How to Fix in Production**:
  Build a synthetic campus graph generator script (`pnpm db:seed:large`) that synthesizes a 5-building campus with 500 nodes, 1,200 edges, diverse ramp slopes, and elevator shafts to benchmark pathfinding latency and memory under realistic institutional loads.
