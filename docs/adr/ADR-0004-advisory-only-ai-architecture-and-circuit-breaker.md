# ADR-0004: Advisory-Only AI Architecture and Circuit Breaker Resilience

## Status
Accepted

## Context
PathPulse receives crowdsourced barrier descriptions and evidence photos. Machine learning can assist moderators by suggesting category classifications (`BROKEN_LIFT`, `BLOCKED_RAMP`, `INACCESSIBLE_ENTRANCE`), estimated severity, and potential duplicates.
However, accessibility navigation is safety-critical: incorrect autonomous classifications could mask dangerous physical barriers or close genuine reports. Furthermore, external AI models or machine learning runtimes can experience high latency or crashes.

## Decision
1. **Advisory-Only Invariant**: AI output is strictly classified as advice. The schema explicitly enforces `requiresHumanVerification: true` via Pydantic schemas, TypeScript interfaces, and a PostgreSQL database check constraint (`chk_ai_suggestions_human_verification`). AI predictions cannot alter report status or route availability directly.
2. **Dedicated Python Microservice**: Implement AI suggestions in a lightweight, independent Python FastAPI service (`apps/ai-service`) using scikit-learn TF-IDF and keyword rules, running with a non-root user in a minimal container.
3. **Circuit Breaker & Fallback**: The NestJS API invokes the AI service via an Opossum circuit breaker with:
   - 500ms timeout
   - 50% error threshold over 10 requests
   - 10-second reset window
4. **Graceful Degradation**: If the AI service fails or times out, report submission and moderation proceed normally without suggestions.

## Consequences
### Positive
- High safety guarantee: Eliminates hallucinated or autonomous decisions that could compromise physical safety.
- Decoupled resilience: An outage in the AI service never disrupts core reporting, authentication, or route planning.
- Memory isolation: Heavy Python ML dependencies do not impact the Node.js event loop.

### Negative / Trade-offs
- Requires managing and deploying a separate Python container alongside the Node.js API.
