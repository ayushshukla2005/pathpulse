# PathPulse: Systems Design Interview Practice

This document provides three end-to-end system design interview blueprints derived directly from PathPulse's architectural domain. Each problem includes explicit mathematical capacity estimations, component diagrams, data model extensions, consistency trade-offs, and failure mode analyses.

---

## System Design Problem 1: High-Throughput Indoor Navigation Service (1M DAU)

### 1. Requirements & Assumptions
- **Functional**:
  - Compute multi-floor accessible routes between two nodes in a building within 100ms.
  - Support mobility profiles: Wheelchair (step-free only), Assisted, Standard.
  - Reflect facility status changes (e.g. broken elevators) in real time (<1 second).
- **Non-Functional**:
  - High availability: 99.99% uptime.
  - Read-heavy workload: 1,000:1 read-to-write ratio.
  - Global scale: 50,000 buildings, average 200 nodes and 400 edges per building.

### 2. Capacity Estimation & Calculations
- **Traffic**:
  - 1,000,000 Daily Active Users (DAU).
  - Average 5 route queries per user per day = $5,000,000$ route queries/day.
  - Average QPS = $\frac{5,000,000}{86,400} \approx 58 \text{ queries/second}$.
  - Peak QPS (3x multiplier during campus class changes/rush hour) = $175 \text{ QPS}$.
- **Graph Storage**:
  - 50,000 buildings $\times$ 200 nodes = 10,000,000 nodes.
  - 50,000 buildings $\times$ 400 edges = 20,000,000 edges.
  - Node record $\approx 100$ bytes $\rightarrow 1 \text{ GB}$.
  - Edge record $\approx 150$ bytes $\rightarrow 3 \text{ GB}$.
  - Total topological dataset fits comfortably in memory: $\approx 4 \text{ GB}$ uncompressed.
- **Cache Sizing (Redis)**:
  - Assume top 20% origin-destination pairs generate 80% of traffic.
  - 1,000,000 cached routes $\times 2 \text{ KB per route JSON} \approx 2 \text{ GB}$.

### 3. Architecture & Components
```
[ Client App ] ---> [ Cloudflare CDN / WAF ]
                           |
                     [ API Gateway / ALB ]
                           |
         +-----------------+-----------------+
         |                                   |
[ Navigation Service Nodes ]       [ Facility Invalidation Worker ]
  (In-Memory Graph LRU Cache)                       |
         |                                          v
         +-------------> [ Redis Cluster ] <--------+
         |                 (Route Caches)
         v
[ PostgreSQL 16 + PostGIS ]
  (Primary + 3 Read Replicas)
```

### 4. Caching & Consistency Strategy
- **Graph In-Memory Pre-loading**: Navigation service workers keep compiled building graphs in local RAM. When a route query arrives, the worker checks its local graph.
- **Versioned Keys**: Cache keys follow `route:v2:${buildingId}:${graphVersion}:${profile}:${orig}:${dest}`.
- **Atomic Invalidation**: When a facility status changes, a database transaction bumps `buildings.graph_version`. The API publishes an invalidation event across Redis Pub/Sub. All navigation worker nodes evict their local graph and fetch the new graph topology.

### 5. Failure Modes & Mitigations
- **Redis Cluster Outage**: If Redis goes down, the navigation service executes Dijkstra in-memory. Response latency increases from 5ms to 25ms, but the service remains 100% available without dropping queries.
- **Graph Disconnection**: If a critical elevator goes down and no step-free path exists, the service fails safe with an explicit `NO_CONFIRMED_ROUTE` payload and suggests nearby accessible entrances.

### 6. What PathPulse Already Does vs. What to Add
- **Already Implemented**: Monotonic graph versioning, Redis cache keys, Dijkstra with min-heap tie-breaking, hard edge filtering.
- **To Add for 1M DAU**: Pre-computed Contraction Hierarchies (CH) for sub-millisecond queries on massive airport graphs, in-process LRU graph caching, and PgBouncer connection pooling.

---

## System Design Problem 2: Scalable Community Barrier Reporting & Moderation Pipeline

### 1. Requirements & Assumptions
- **Functional**:
  - Accept barrier reports with descriptions, coordinates, and photo evidence.
  - Direct image upload without API buffering.
  - Human moderation workflow with strict separation of duties.
  - Automated duplicate report suggestions and advisory classification.
- **Scale**:
  - 50,000 reports submitted daily across worldwide venues.
  - Average 2 photos per report (average photo size: 3 MB).

### 2. Capacity Estimation
- **Write QPS**:
  - 50,000 reports/day $\approx 0.6 \text{ reports/second}$ (Peak: 10 QPS).
- **Media Storage Bandwidth**:
  - 50,000 reports $\times 2 \text{ photos} = 100,000 \text{ photos/day}$.
  - Daily Ingestion Volume: $100,000 \times 3 \text{ MB} = 300 \text{ GB/day}$.
  - Annual Storage: $300 \text{ GB} \times 365 \approx 110 \text{ TB/year}$.
  - Offloading this to direct S3 presigned URLs saves $300 \text{ GB/day}$ of ingress/egress bandwidth from backend servers.

### 3. Architecture & Components
```
[ User Browser / App ] -- 1. Request Presigned PUT --> [ API Gateway ]
        |                                                    |
        | 2. Direct Binary PUT (300 GB/day)                  v
        +-----------------------------------------> [ AWS S3 Bucket ]
        |                                                    |
        | 3. Submit Report (Object Key)                      |
        v                                                    v
[ Core API (NestJS) ] -- 4. HeadObject Probe --------> [ S3 Storage ]
        |
        +-- 5. Commit SUBMITTED Report (PostgreSQL)
        |
        +-- 6. Enqueue Moderation Job (BullMQ / Redis)
                    |
                    v
         [ Moderation Workers ]
                    |
                    +-- Asynchronous HTTP (Circuit Breaker)
                    v
         [ Python AI Advisory Service ] (FastAPI / TF-IDF / ViT)
                    |
                    +-- Returns Suggestions (requiresHumanVerification: true)
                    v
         [ PostgreSQL: ai_suggestions table ]
```

### 4. Data Model Extensions for Scale
- **Spatial Partitioning**: Partition `issue_reports` by region or country code using PostgreSQL declarative partitioning.
- **Vector Search for Duplicates**: Add `embedding vector(384)` to `issue_reports` using `pgvector`. Use HNSW indexing for instant semantic similarity search within a 50-meter bounding box (`ST_DWithin`).

### 5. Failure Modes & Mitigations
- **S3 Upload Without Report Submission**: Users upload photos via presigned URLs but close their browser before clicking submit. **Mitigation**: S3 lifecycle rule auto-deletes unreferenced files in `uploads/` after 24 hours.
- **AI Service Degradation**: Python service crashes or encounters memory exhaustion under heavy image bursts. **Mitigation**: Opossum circuit breaker opens after 3 timeouts; reports remain in queue and human moderation proceeds without advisory delays.

### 6. What PathPulse Already Does vs. What to Add
- **Already Implemented**: Presigned PUT URLs, S3 `HeadObject` verification, pure function state machine with separation of duties, tamper-evident audit triggers, circuit breaker.
- **To Add for Scale**: `pgvector` HNSW index for duplicate text search, S3 event notifications (SQS) for automated virus scanning.

---

## System Design Problem 3: Offline Building Maps & Navigation for Low-Connectivity Areas

### 1. Requirements & Assumptions
- **Functional**:
  - Full route planning and turn-by-turn guidance must work inside subterranean basements, parking garages, and rural venues with zero cellular or Wi-Fi signal.
  - Seamless sync when connectivity is restored.
- **Constraints**:
  - Mobile client storage budget: Maximum 50 MB per downloaded venue.

### 2. Architecture & Components
```
             [ Cloud Backend ]
                     |
         (Map Compilation Pipeline)
                     |
         +-----------+-----------+
         |                       |
   [ Vector Tiles ]      [ Compiled Graph FlatBuffers ]
   (.mbtiles / GeoJSON)   (Compact binary adjacency list)
         |                       |
         +-----------+-----------+
                     | HTTPS (When Online)
                     v
             [ Mobile / Web Client ]
                     |
         +-----------+-----------+
         |                       |
  [ SQLite / OPFS ]      [ WebAssembly Routing Engine ]
  (Offline Storage)       (Compiled C++ / Rust Dijkstra)
```

### 3. Client Storage & Data Format
- Instead of downloading raw JSON graphs (which are verbose), compile the building topology into **FlatBuffers** or **Protocol Buffers**.
- A 500-node, 1,000-edge building graph compiles to less than **250 KB** in binary format.
- Store maps locally using the Origin Private File System (OPFS) or SQLite via WebAssembly (sql.js / wa-sqlite).

### 4. Offline Consistency & Sync Strategy
- **Graph Version Stamping**: The client stores the venue's `graph_version`.
- **Delta Sync**: When coming online, the client queries `GET /api/v1/venues/:id/sync?sinceVersion=4`. The server returns only edges modified since version 4, minimizing mobile data usage.
- **Offline Reports Queue**: Reports filed offline are stored in IndexedDB. When network returns, a service worker drains the queue with idempotent tracking IDs.

### 5. What PathPulse Already Does vs. What to Add
- **Already Implemented**: Monotonic graph versions, pure Dijkstra routing algorithm separated from database models.
- **To Add for Offline**: Porting `dijkstra.ts` to WebAssembly/Rust for execution inside client Service Workers, FlatBuffer binary graph serialization, and client-side IndexedDB report sync queue.
