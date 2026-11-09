# PathPulse

**Navigate Without Barriers** — An accessibility-first multi-floor indoor and outdoor navigation platform that empowers people with diverse mobility requirements to discover, plan, and follow verified accessible journeys through complex institutional venues.

[![CI/CD Pipeline](https://github.com/pathpulse/pathpulse/actions/workflows/ci.yml/badge.svg)](https://github.com/pathpulse/pathpulse/actions/workflows/ci.yml)
[![WCAG 2.2 AA](https://img.shields.io/badge/accessibility-WCAG%202.2%20AA-005a9c.svg)](docs/adr/ADR-0006-accessibility-wcag22-and-direct-s3-upload-pattern.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Problem Statement & Philosophy

Traditional navigation applications stop at the building exterior door, leaving visitors who use wheelchairs, canes, strollers, or have low vision to navigate unmapped stairwells, heavy manual doors, and broken elevators.

PathPulse bridges this gap through four foundational principles:
1. **The Verification Principle**: No route is presented as accessible unless every intermediate segment is confirmed step-free across all elevators and pathways. The client UI never computes or infers safety on its own.
2. **Direct-to-S3 Photographic Evidence**: User barrier reports include photographic proof uploaded directly to object storage via presigned URLs, keeping application servers free of media buffering.
3. **Pure Function Moderation Machine**: All barrier lifecycle transitions follow an immutable state machine enforcing strict separation of duties and self-action prohibitions.
4. **Advisory-Only Machine Intelligence**: AI assists human moderators with category suggestions and duplicate detection, but is mathematically prevented from mutating report statuses or route availability autonomously.

---

## 2. Architecture & Monorepo Structure

```
pathpulse/
├── apps/
│   ├── web/                    # Next.js 15 Standalone Web App (React 19, MapLibre GL, TanStack Query)
│   ├── api/                    # NestJS Core Backend (Prisma, BullMQ, Socket.IO, Pino, Sentry)
│   └── ai-service/             # Python 3.13 FastAPI Service (scikit-learn TF-IDF, Uvicorn)
├── packages/
│   ├── shared-types/           # Shared TypeScript interfaces, enums, and API contracts
│   └── validation/             # Shared validation schemas (zod / class-validator parity)
├── docs/                       # Architecture, API specifications, ADRs, and runbooks
│   ├── architecture.md         # Full system architecture & data flow diagrams
│   ├── api.md                  # Complete REST & WebSocket API specification
│   ├── database.md             # Schema, PostGIS indices, triggers, and constraints
│   ├── deployment.md           # Production deployment guide (Render & Vercel)
│   ├── runbook-migrations.md   # Production database migration and rollback runbook
│   ├── demo-script.md          # 3-minute interactive walkthrough demo script
│   └── adr/                    # Architecture Decision Records (ADR-0001 to ADR-0006)
├── docker-compose.prod.yml     # Multi-container production compose specification
└── .github/workflows/ci.yml    # Comprehensive CI/CD test, lint, e2e, build, and deploy pipeline
```

---

## 3. Quick Start & Local Development

### 3.1 Prerequisites
- **Node.js**: `v22.x` (managed via `.nvmrc`)
- **pnpm**: `v9.x` (`corepack enable pnpm`)
- **Python**: `3.13.x` (for `apps/ai-service`)
- **Docker & Docker Compose**: (for PostgreSQL with PostGIS, Redis, and MinIO)

### 3.2 Environment Setup
Copy the development environment templates:
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

### 3.3 Install Dependencies
```bash
# Install Node dependencies
pnpm install

# Setup Python virtualenv for AI service
cd apps/ai-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ../..
```

### 3.4 Start Local Infrastructure
```bash
docker compose up -d postgres redis minio
```

### 3.5 Database Migrations & Seed
```bash
pnpm --filter @pathpulse/api exec prisma migrate deploy
pnpm --filter @pathpulse/api db:seed
```

### 3.6 Run Development Servers
```bash
# Start all services concurrently:
pnpm dev

# Or start individually:
pnpm --filter @pathpulse/api start:dev    # http://localhost:4000
pnpm --filter @pathpulse/web dev          # http://localhost:3000
# AI service:
cd apps/ai-service && .venv/bin/uvicorn app.main:app --port 8000 --reload
```

---

## 4. Testing & Quality Verification

| Scope | Command | Description |
| :--- | :--- | :--- |
| **Linting (Node)** | `pnpm lint` | ESLint across web, api, and shared packages |
| **Linting (Python)** | `cd apps/ai-service && ruff check .` | Ruff linter for AI service |
| **Typecheck** | `pnpm typecheck` | Strict TypeScript checks across all workspaces |
| **API Unit Tests** | `pnpm --filter @pathpulse/api test` | Jest test suite including redactor, Sentry, state machine |
| **Web Unit Tests** | `pnpm --filter @pathpulse/web test` | Vitest component, hook, and accessibility unit tests |
| **AI Service Tests** | `cd apps/ai-service && pytest tests -v` | Pytest suite for classifier, summarizer, and duplicates |
| **API Integration** | `pnpm --filter @pathpulse/api test:e2e` | Supertest E2E tests against PostgreSQL & Redis |
| **Playwright & Axe**| `pnpm --filter @pathpulse/web test:e2e` | Playwright E2E with automated axe-core WCAG 2.2 scans |

---

## 5. Production Deployment Summary

PathPulse is built for cloud deployment using **Render** (API, AI service, managed PostgreSQL with PostGIS, and managed Redis) and **Vercel** (Next.js standalone frontend):

- **Docker Images**: Pre-configured multi-stage, non-root Dockerfiles available in `apps/api/Dockerfile`, `apps/web/Dockerfile`, and `apps/ai-service/Dockerfile`.
- **Production Compose**: Run `docker compose -f docker-compose.prod.yml up -d` to spin up the entire cluster locally or on an EC2/VM host.
- **Migration Strategy**: Migrations are strictly decoupled from container startup; execute via `pnpm --filter @pathpulse/api migrate:deploy` during CI/CD release phases.
- **Detailed Guide**: See [docs/deployment.md](docs/deployment.md) and [docs/runbook-migrations.md](docs/runbook-migrations.md).

---

## 6. Architecture Decision Records (ADRs)

- [ADR-0001: PostGIS Spatial Indexing and Relational Graph Storage](docs/adr/ADR-0001-postgis-spatial-and-graph-storage.md)
- [ADR-0002: Pure Function Report State Machine and Separation of Duties](docs/adr/ADR-0002-pure-function-report-state-machine.md)
- [ADR-0003: Append-Only Audit Log with PostgreSQL Tamper-Evident Trigger](docs/adr/ADR-0003-append-only-audit-log-tamper-trigger.md)
- [ADR-0004: Advisory-Only AI Architecture and Circuit Breaker Resilience](docs/adr/ADR-0004-advisory-only-ai-architecture-and-circuit-breaker.md)
- [ADR-0005: Graph Versioning and Distributed Cache Invalidation](docs/adr/ADR-0005-graph-versioning-and-distributed-cache-invalidation.md)
- [ADR-0006: WCAG 2.2 Accessibility Compliance and Direct S3 Evidence Upload](docs/adr/ADR-0006-accessibility-wcag22-and-direct-s3-upload-pattern.md)

---

## 7. Accessibility Statement & Compliance

PathPulse is committed to digital and physical accessibility:
- Public Accessibility Statement: [/accessibility](http://localhost:3000/accessibility)
- Standards: W3C WCAG 2.2 Level AA, India Rights of Persons with Disabilities (RPwD) Act 2016, and Accessible India Campaign guidelines.
- Contact Accessibility Team: [accessibility@pathpulse.org](mailto:accessibility@pathpulse.org)
