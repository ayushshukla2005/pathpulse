# PathPulse

Navigate Without Barriers — An intelligent accessibility and navigation platform that helps people discover, plan, and navigate routes through buildings and public places based on their actual mobility and accessibility requirements.

## Repository Architecture

This repository is structured as a pnpm monorepo:

- `apps/web`: Next.js web application and interactive portals.
- `apps/api`: NestJS REST backend, spatial graph routing, and moderation workflows.
- `apps/ai-service`: AI and ML service for report classification, OCR, and barrier detection.
- `packages/shared-types`: Shared TypeScript definitions and API contracts.
- `packages/validation`: Shared validation schemas and rules.
- `packages/config`: Common configuration presets.
- `infrastructure/`: Docker Compose definitions and database migration scripts.

## Local development

### 1. Environment Configuration

Copy the example environment file to create your local `.env`:

```bash
cp .env.example .env
```

#### Required Environment Variables

The backend API validates environment variables at startup and fails fast if any required setting is missing or uses insecure default placeholders:

- `DATABASE_URL`: Full PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/pathpulse`).
- `WEB_ORIGIN`: Allowed frontend origin for CORS (e.g. `http://localhost:3000`).
- `API_PORT`: Port on which the API listens (defaults to `4000`).
- `JWT_ACCESS_SECRET`: Secret key for signing access tokens (minimum 32 characters; default placeholder strings are rejected).
- `JWT_REFRESH_SECRET`: Secret key for signing refresh tokens (minimum 32 characters; default placeholder strings are rejected).
- `REDIS_URL`: Redis connection URL for queues and caching (e.g. `redis://localhost:6379`).
- `TEST_REDIS_URL`: Redis connection URL with an isolated database index for integration tests (e.g. `redis://localhost:6379/1`).
- `ROUTE_CACHE_TTL_SECONDS`: Route calculation cache time-to-live in seconds (defaults to `900` / 15 minutes).
- `SEED_ADMIN_PASSWORD`: Password for the demo organization admin (`demo-admin@pathpulse.local`) when running database seed scripts.
- `NEXT_PUBLIC_API_URL`: Client-side base URL for API requests (e.g. `http://localhost:3000`).
- `API_BASE_URL`: Backend NestJS API URL used by Next.js server route handlers (e.g. `http://localhost:4000`).
- `COOKIE_SECRET`: Secret key for session cookie signing (minimum 32 characters; default placeholder strings are rejected).

### 2. Install Dependencies

Install all monorepo dependencies:

```bash
pnpm install
```

### 3. Build Shared Packages

Build the TypeScript shared packages before running apps:

```bash
pnpm --filter @pathpulse/shared-types build
pnpm --filter @pathpulse/validation build
```

### 4. Start Local Infrastructure Services

Start PostgreSQL with PostGIS, Redis, and MinIO in the background:

```bash
docker compose up -d
```

### 5. Verify Services

Check that all containerized services are running and healthy:

```bash
docker compose ps
```

Verify that PostgreSQL and the PostGIS spatial extension are operating correctly:

```bash
docker compose exec postgres psql -U pathpulse -d pathpulse -c "SELECT PostGIS_Version();"
```

### 6. Database Migrations and Seeding

Run Prisma migrations and seed the sample campus data:

```bash
cd apps/api
pnpm exec prisma migrate deploy
pnpm db:seed
cd ../..
```

### 7. Run the Applications (Startup Order)

Start the services in the following order:

1. **Infrastructure**: `docker compose up -d` (PostgreSQL, Redis, MinIO)
2. **API Backend**:
   ```bash
   pnpm --filter @pathpulse/api start:dev
   ```
   Listens on `http://localhost:4000` with Swagger docs at `http://localhost:4000/docs`.
3. **Web Frontend**:
   ```bash
   pnpm --filter @pathpulse/web dev
   ```
   Listens on `http://localhost:3000`.

### 8. Testing

Run backend tests:

```bash
cd apps/api
pnpm test
pnpm test:e2e
cd ../..
```

Run frontend unit, component, and accessibility E2E tests:

```bash
cd apps/web
pnpm test
pnpm test:e2e
cd ../..
```

### 9. Production Builds

Build all packages and applications:

```bash
pnpm --filter @pathpulse/shared-types build
pnpm --filter @pathpulse/validation build
pnpm --filter @pathpulse/api build
pnpm --filter @pathpulse/web build
```

### 10. Code Quality Checks

Run linting across all workspaces:

```bash
pnpm lint
```

Run TypeScript compilation checks across all workspaces:

```bash
pnpm typecheck
```
