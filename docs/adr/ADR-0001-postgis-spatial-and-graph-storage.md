# ADR-0001: PostGIS Spatial Indexing and Relational Graph Storage

## Status
Accepted

## Context
PathPulse serves multi-floor indoor and outdoor routing across complex topological environments (campuses, hospitals, transit terminals). The application must perform two distinct types of queries:
1. **Spatial Geospatial Queries**: Searching for venues within a given radius, finding nearest accessible entrances via spherical distance, and geofencing crowdsourced barrier reports.
2. **Relational Graph Queries**: Navigating across nodes, edges, multi-floor transitions (elevators, stairs, ramps), and checking facility status at each edge.

Alternative architectures considered were:
- **NoSQL / Document Store (MongoDB)**: Good for geospatial indexing, but lacks strict ACID transactions, relational graph foreign key constraints, and multi-table integrity needed during simultaneous facility and graph updates.
- **Dedicated Graph Database (Neo4j)**: Excellent for deep traversals, but adds significant operational complexity, lacks native spatial indexing at parity with PostGIS, and requires distributed transaction coordination with the primary database.

## Decision
Adopt **PostgreSQL 16 with the PostGIS 3.4 spatial extension** as the single authoritative datastore for both spatial coordinates and graph topology.
- Coordinates are stored as `geography(Point, 4326)`.
- Spatial indices are created using `USING GIST (location)`.
- Graph relationships (nodes, edges, floors, buildings) are stored relationally with strict foreign keys and check constraints.

## Consequences
### Positive
- Unified storage layer: Eliminates dual-write anomalies and distributed transaction coordination.
- ACID guarantees: Graph version bumps, edge status updates, and audit log writes execute atomically in a single transaction.
- Sub-millisecond spatial operations: PostGIS `ST_DWithin` and `<->` k-nearest-neighbor operators utilize GiST indexing efficiently.

### Negative / Trade-offs
- Deep graph pathfinding across hundreds of nodes is computed in application memory (Dijkstra / A*) rather than native Cypher graph query syntax.

