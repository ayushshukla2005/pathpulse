# PathPulse System Architecture

## System Overview

PathPulse is an intelligent accessibility and multi-floor navigation platform that connects people with specific mobility requirements to verified indoor and outdoor navigable journeys.

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer"]
        Web["Next.js Web App (SSR / CSR / MapLibre GL)"]
    end

    subgraph ApiGateway["API & Application Layer"]
        NestApi["NestJS Core API (Modular Monolith)"]
        AuthModule["Auth & RBAC"]
        NavigationEngine["Graph Routing Engine (Dijkstra / A*)"]
        FacilityModule["Facility & Real-time State"]
        ReportingModule["Reporting & Verification Workflow"]
        OrgModule["Organization & Map Editor"]
    end

    subgraph AsyncProcessing["Async Processing Layer"]
        Queue["BullMQ Worker Queues"]
    end

    subgraph AIService["AI & Computer Vision Layer"]
        FastAPI["Python FastAPI Service (Vision & NLP)"]
    end

    subgraph DataStorage["Data & Storage Layer"]
        Postgres["PostgreSQL 16 + PostGIS 3.4"]
        Redis["Redis 7 (Cache, Sessions, Queues)"]
        ObjectStorage["S3-Compatible Storage (MinIO)"]
    end

    Web -->|HTTPS / REST / WebSocket| NestApi
    NestApi --> AuthModule
    NestApi --> NavigationEngine
    NestApi --> FacilityModule
    NestApi --> ReportingModule
    NestApi --> OrgModule

    NestApi -->|Read / Write & Spatial Queries| Postgres
    NestApi -->|Cache & State Invalidation| Redis
    NestApi -->|Enqueue Background Jobs| Queue
    Queue -->|Async Processing| NestApi

    NestApi -->|Presigned URL Generation| ObjectStorage
    Web -->|Direct Upload with Presigned URL| ObjectStorage

    ReportingModule -->|Async Job / Internal REST| FastAPI
    FastAPI -->|Fetch Evidence Photo| ObjectStorage
    FastAPI -->|Triage & Obstacle Predictions| ReportingModule
```

## Architecture Decision Records (ADR)

### ADR-001: Modular Monolith over Microservices

- **Context**: PathPulse requires transactional integrity across venues, multi-floor graphs, facilities, crowdsourced reports, and audit trails. Building distributed microservices early introduces network hops, eventual consistency challenges, dual-write complexities, and operational overhead.
- **Decision**: Adopt a modular monolith built on NestJS inside a unified monorepo. Modules (`auth`, `venues`, `navigation`, `facilities`, `reports`, `audit`) are logically bounded with strict dependency boundaries and shared type contracts.
- **Consequences**: Fast local development, atomic ACID transactions for route graph and facility state changes, simplified deployments, and clean boundary separation that permits splitting out high-throughput services later if required.

### ADR-002: PostgreSQL with PostGIS over MongoDB

- **Context**: Navigation requires relational graph integrity (nodes, edges, floors, buildings, facilities) alongside native spatial geospatial indexing and calculations (geofencing, finding nearest accessible entrances via spherical distance).
- **Decision**: Use PostgreSQL 16 with the PostGIS 3.4 spatial extension.
- **Consequences**:
  - Full relational integrity: Foreign key constraints, unique composite keys, check constraints, and transactional rollbacks.
  - Native spatial power: PostGIS `geography(Point, 4326)` with spatial GiST indexing enables performant k-nearest-neighbors (`<->`) and distance queries.
  - Complex graph queries: PostgreSQL recursive CTEs and typed relationships outperform document databases for structured multi-floor topological graphs.

### ADR-003: AI Service Behind an Isolated Service Boundary

- **Context**: Barrier classification, duplicate report clustering, and visual obstacle recognition benefit from Python's machine learning and computer vision ecosystem (PyTorch, OpenCV, Transformers).
- **Decision**: Isolate AI processing within an asynchronous Python FastAPI service. The NestJS core API communicates with it via asynchronous BullMQ queues or isolated internal REST calls.
- **Consequences**:
  - Independent runtime environments: Node.js handles I/O-intensive navigation queries and WebSockets, while Python manages memory-heavy image and tensor operations.
  - Failure containment: Heavy computer vision jobs or ML failures never block core navigation, authentication, or reporting operations.
  - Strict human verification invariant: The AI service returns suggestions (confidence scores, detected barrier classes); core business logic marks all AI outputs as suggestions requiring human or moderator verification before committing state changes.
