# ADR-0002: Pure Function Report State Machine and Separation of Duties

## Status
Accepted

## Context
Accessibility barrier reports progress through multiple lifecycle stages: `SUBMITTED`, `TRIAGED`, `IN_PROGRESS`, `RESOLVED`, `CONFIRMED_RESOLVED`, `REJECTED`, and `REOPENED`. 
In complex web applications, lifecycle logic often becomes scattered across controller guards, service methods, and database triggers. This leads to subtle privilege escalations, unauthorized status transitions, and self-verification loopholes (e.g. a user verifying or confirming the resolution of their own report).

## Decision
Implement the entire report lifecycle transition engine as a **pure function** (`transitionReport`) located in domain logic without framework, ORM, or database dependencies:
1. **Allowed Transition Matrix**: Transitions are strictly governed by a lookup table defining target states, required roles, and prerequisite conditions.
2. **Self-Action Prohibition**: Users cannot verify, assign, or triage their own reports.
3. **Separation of Duties**: The user who marked a report as `RESOLVED` cannot execute the subsequent `CONFIRMED_RESOLVED` transition.
4. **Pure Evaluation**: The function accepts the current report, the acting user, and the desired transition payload, returning either `{ success: true, nextState }` or `{ success: false, reason }`.

## Consequences
### Positive
- 100% deterministic testing: State transitions, edge cases, role violations, and separation of duties can be exhaustively unit-tested without database mocks or network fixtures.
- Security-in-depth: Controllers and services enforce role checks, but domain logic independently verifies security constraints regardless of the caller.

### Negative / Trade-offs
- Calling services must load the relevant report context (reporter ID, previous resolver ID) before calling the pure transition function.

