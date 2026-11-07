# PathPulse Agent Rules

## Product

PathPulse is an accessibility-aware indoor and outdoor navigation platform. Users with mobility, visual, and other access needs find places, navigate routes inside buildings (including multi-floor routing via lifts and ramps), see whether facilities are verified and operational, and report barriers for institutions to fix. Accessibility preferences are navigation preferences, never medical diagnoses.

## Non-negotiable product rules

1. Unknown accessibility data is never treated as accessible. Every route segment is labeled CONFIRMED, UNVERIFIED, or UNAVAILABLE.
2. A step-free profile never receives a confirmed route containing stairs.
3. A route never depends on a confirmed out-of-service lift.
4. AI never certifies a place as safe or accessible. AI only assists classification and triage. Humans verify.
5. Users cannot verify or resolve their own reports. Every status change writes an audit log entry.
6. Every protected endpoint enforces role checks and ownership checks.

## Tech stack (do not change without asking the user)

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, MapLibre GL JS
- Backend: Node.js, NestJS, TypeScript (strict), REST under /api/v1, class-validator DTOs
- Database: PostgreSQL 16 with PostGIS 3.4, Prisma for migrations and typed queries, raw SQL via $queryRaw for PostGIS geometry
- Cache and queues: Redis, BullMQ
- Object storage: S3-compatible (MinIO locally) with presigned uploads
- AI service: Python FastAPI (introduced later)
- Testing: Jest, Supertest, Playwright, axe-core, k6
- Infrastructure: Docker, docker-compose, GitHub Actions
- Monorepo: pnpm workspaces

## Code rules

- No comments inside code unless the user explicitly asks.
- Strict TypeScript. No `any` unless justified in a comment-free note in the chat reply.
- Complete, runnable files. No placeholders such as "// rest of code here".
- Use full file paths when reporting changes.
- Prefer clean, minimal, idiomatic code over clever code.

## Working rules

- Complete only the current step. Do not start the next step.
- Prefer working files over long planning. Keep any plan to a few lines.
- Run the verification commands yourself and report the actual output.
- If a command fails, identify the exact cause, apply the minimal fix, and explain why it failed.
- If unsure about an API or version, check the official documentation rather than guessing.
- Commit at the end of each step with the message given in that step.
- End every step with a short report: files created or changed, commands run, verification results, and known issues.
