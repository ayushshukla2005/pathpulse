# PathPulse Code Walkthrough Map

This document maps every foundational concept in PathPulse directly to its concrete source implementation file, the key class or function, and the unit or integration test suite that proves its correctness.

---

## 1. Core Architecture & Engineering Map

| Concept | Implementation File | Key Class / Function | Proving Test Suite | Architectural Invariant Proved |
| :--- | :--- | :--- | :--- | :--- |
| **1. Graph Construction** | `apps/api/src/navigation/graph/graph-loader.service.ts` | `GraphLoaderService.loadGraphFromDb` | `apps/api/src/navigation/navigation.service.spec.ts` | Queries relational nodes and edges, builds topological in-memory adjacency list, and attaches facility status. |
| **2. Accessibility Hard Filter** | `apps/api/src/navigation/routing/filter.ts` | `filterGraph(graph, rules)` | `apps/api/src/navigation/routing/__tests__/filter.spec.ts` | Completely prunes physically impossible edges (`OUT_OF_SERVICE` elevators, stairs for wheelchairs) before pathfinding. |
| **3. Binary Min-Heap** | `apps/api/src/navigation/routing/min-heap.ts` | `MinHeap<T>.push`, `pop`, `isHigherPriority` | `apps/api/src/navigation/routing/__tests__/min-heap.spec.ts` | Priority queue with monotonic `sequenceCounter` sequence tie-breaking for strict FIFO determinism. |
| **4. Dijkstra Pathfinding** | `apps/api/src/navigation/routing/dijkstra.ts` | `findShortestPath(filteredAdj, start, dest, rules)` | `apps/api/src/navigation/routing/__tests__/routing.spec.ts` | Non-negative edge weight Dijkstra with deterministic neighbor ID sorting and predecessor path back-tracing. |
| **5. Route & Confidence Builder** | `apps/api/src/navigation/routing/route-builder.ts` | `buildRoute(path, graph, profile, rules)` | `apps/api/src/navigation/routing/__tests__/routing.spec.ts` | Labels route as accessible strictly when `isStepFree === true` AND every segment is `CONFIRMED`. Grouped by floor transitions. |
| **6. Cache Key & Graph Version** | `apps/api/src/navigation/routes.service.ts` | `RoutesService.buildCacheKey` | `apps/api/src/navigation/routes.service.spec.ts` | Formats `route:v1:${buildingId}:${graphVersion}:${profile}:${origin}:${dest}` ensuring stale version cache isolation. |
| **7. Facility Status Row Lock** | `apps/api/src/facilities/facilities.service.ts` | `FacilitiesService.updateFacilityStatus` | `apps/api/src/facilities/facilities.service.spec.ts` | Executes `SELECT ... FOR UPDATE` row lock, bumps `building.graph_version`, writes audit log, commits, and purges Redis. |
| **8. Audit Log Append-Only** | `apps/api/prisma/migrations/20261108000008_make_audit_logs_append_only/migration.sql` | `trg_prevent_audit_logs_modification` & `prevent_audit_logs_modification` | `apps/api/test/workflow.e2e-spec.ts` | Database trigger and table permission revocation (`REVOKE UPDATE, DELETE`) unconditionally blocking tampering. |
| **9. Report State Machine** | `apps/api/src/reports/workflow/state-machine.ts` | `transitionReportState(context)` | `apps/api/src/reports/workflow/__tests__/state-machine.spec.ts` | Pure function enforcing state transitions, role authorizations, and allowed action matrices without external I/O. |
| **10. Separation of Duties** | `apps/api/src/reports/workflow/state-machine.ts` | `transitionReportState` (lines 128-150) | `apps/api/src/reports/workflow/__tests__/state-machine.spec.ts` | Prohibits self-action (reporters cannot verify/assign/resolve) and enforces that resolvers cannot confirm/close their own fix. |
| **11. WebSocket Authorization** | `apps/api/src/realtime/realtime.gateway.ts` | `RealtimeGateway.handleConnection`, `handleSubscribeBuilding` | `apps/api/src/realtime/realtime.gateway.spec.ts` | Authenticates connections with JWT; validates building existence and rate limits subscriptions per client before room join. |
| **12. Circuit Breaker Resilience** | `apps/api/src/ai/circuit-breaker.ts` | `CircuitBreaker.execute` | `apps/api/src/ai/circuit-breaker.spec.ts` | Finite state machine (`CLOSED`, `OPEN`, `HALF_OPEN`) fast-failing downstream AI calls upon exceeding 3 failures in 10s. |
| **13. Advisory AI Classifier** | `apps/ai-service/app/classifier.py` | `ReportClassifier.classify` | `apps/ai-service/evaluation/results.txt`, `apps/ai-service/tests/test_classifier.py` | TF-IDF (1,2 ngrams) + LogisticRegression with keyword fallback; enforces `requiresHumanVerification: true` by schema. |
| **14. Presigned Upload Verification** | `apps/api/src/reports/storage.service.ts` | `StorageService.getPresignedPutUrl`, `headObject` | `apps/api/src/reports/__tests__/evidence-verification.spec.ts` | Mints 15-min presigned PUT URLs for direct client S3 upload; verifies existence, MIME type, and size via `HeadObjectCommand`. |

---

## 2. Verification Command

Every file listed above exists on disk. Run this PowerShell command from the repository root to verify all 14 implementation paths and test suites:

```powershell
$files = @(
  "apps/api/src/navigation/graph/graph-loader.service.ts",
  "apps/api/src/navigation/navigation.service.spec.ts",
  "apps/api/src/navigation/routing/filter.ts",
  "apps/api/src/navigation/routing/__tests__/filter.spec.ts",
  "apps/api/src/navigation/routing/min-heap.ts",
  "apps/api/src/navigation/routing/__tests__/min-heap.spec.ts",
  "apps/api/src/navigation/routing/dijkstra.ts",
  "apps/api/src/navigation/routing/__tests__/routing.spec.ts",
  "apps/api/src/navigation/routing/route-builder.ts",
  "apps/api/src/navigation/routes.service.ts",
  "apps/api/src/navigation/routes.service.spec.ts",
  "apps/api/src/facilities/facilities.service.ts",
  "apps/api/src/facilities/facilities.service.spec.ts",
  "apps/api/prisma/migrations/20261108000008_make_audit_logs_append_only/migration.sql",
  "apps/api/test/workflow.e2e-spec.ts",
  "apps/api/src/reports/workflow/state-machine.ts",
  "apps/api/src/reports/workflow/__tests__/state-machine.spec.ts",
  "apps/api/src/realtime/realtime.gateway.ts",
  "apps/api/src/realtime/realtime.gateway.spec.ts",
  "apps/api/src/ai/circuit-breaker.ts",
  "apps/api/src/ai/circuit-breaker.spec.ts",
  "apps/ai-service/app/classifier.py",
  "apps/ai-service/evaluation/results.txt",
  "apps/ai-service/tests/test_classifier.py",
  "apps/api/src/reports/storage.service.ts",
  "apps/api/src/reports/__tests__/evidence-verification.spec.ts"
)

foreach ($f in $files) {
  $exists = Test-Path $f
  Write-Host "$f : $(if ($exists) {'EXISTS'} else {'MISSING'})"
}
```
