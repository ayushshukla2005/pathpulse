# ADR-0005: Graph Versioning and Distributed Cache Invalidation

## Status
Accepted

## Context
Multi-floor route calculations across buildings are computationally intensive and are cached in Redis to achieve sub-50ms response times. However, if an elevator goes out of service or a ramp is blocked, serving a stale cached route to a person in a wheelchair is unacceptable.
Standard cache invalidation using key purges (`SCAN` / `DEL`) is asynchronous and vulnerable to network partitions or race conditions where concurrent requests repopulate the cache with stale data.

## Decision
Implement a dual-layer consistency strategy combining **monotonic building graph versioning** and **active Redis cache purging**:
1. **Monotonic Graph Version**: Each building maintains an integer `graph_version` in the database.
2. **Version-Scoped Cache Keys**: Route cache keys follow the structure:
   `route:v1:${buildingId}:${graphVersion}:${mobilityProfile}:${originId}:${destId}`
3. **Atomic Version Bumps**: Any facility status update or edge modification atomically increments `graph_version` inside the same database transaction:
   `UPDATE buildings SET graph_version = graph_version + 1 WHERE id = $1`
4. **Post-Commit Cache Purge**: After transaction commit, the API purges legacy keys matching `route:v1:${buildingId}:*`.
5. **Real-Time Notification**: The new graph version is broadcast to active clients via WebSockets (`facility.status.changed`).

## Consequences
### Positive
- Zero race condition window: The moment the transaction commits, all subsequent route calculations query the new `graphVersion`. Stale cached entries for previous versions are never matched, even if Redis purging is delayed or temporarily unreachable.
- Sub-50ms repeat query latency: High cache hit ratio during steady-state operations.

### Negative / Trade-offs
- Cache size in Redis momentarily increases after a version bump until TTL expiration or key eviction completes.

