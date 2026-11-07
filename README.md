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

### 2. Install Dependencies

Install all monorepo dependencies:

```bash
pnpm install
```

### 3. Start Local Infrastructure Services

Start PostgreSQL with PostGIS, Redis, and MinIO in the background:

```bash
docker compose up -d
```

### 4. Verify Services

Check that all containerized services are running and healthy:

```bash
docker compose ps
```

Verify that PostgreSQL and the PostGIS spatial extension are operating correctly:

```bash
docker compose exec postgres psql -U pathpulse -d pathpulse -c "SELECT PostGIS_Version();"
```

### 5. Run Quality Checks

Run linting across all workspaces:

```bash
pnpm lint
```

Run TypeScript compilation checks across all workspaces:

```bash
pnpm typecheck
```

