# PathPulse Production Deployment Guide

This guide details the deployment architecture, configuration steps, and operational procedures for deploying PathPulse to production using **Render** (for the backend API, AI service, managed PostgreSQL with PostGIS, and managed Redis) and **Vercel** (for the Next.js standalone web frontend).

---

## 1. Cloud Architecture Overview

```
                          [ Internet / End Users ]
                                     |
               +---------------------+---------------------+
               | HTTPS                                     | HTTPS
               v                                           v
       +---------------+                           +---------------+
       |    Vercel     |                           |  Render Edge  |
       |  Next.js Web  |                           |  API Gateway  |
       +-------+-------+                           +-------+-------+
               |                                           |
               | REST / WS                                 |
               +-------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                         |                         |
         v                         v                         v
+-----------------+       +-----------------+       +-----------------+
|   Render API    | <---> |  Render Redis   |       | Render AI Svc   |
|  NestJS Engine  |       |   Cache & Pub   |       |  FastAPI (Slim) |
+--------+--------+       +-----------------+       +-----------------+
         |                                                   ^
         | SQL                                               | Internal
         v                                                   | HTTP Token
+-----------------+                                          |
| Render PostGIS  | -----------------------------------------+
| PostgreSQL DB   |
+-----------------+
         |
         v
+-----------------+
| AWS S3 / Cloud  | (Direct client Presigned PUT / GET)
| Object Storage  |
+-----------------+
```

---

## 2. Infrastructure Provisioning on Render

### 2.1 Managed PostgreSQL with PostGIS
1. Navigate to the Render Dashboard and create a new **PostgreSQL Database**.
2. Settings:
   - **Name**: `pathpulse-db-prod`
   - **Database**: `pathpulse`
   - **User**: `pathpulse_admin`
   - **Region**: Choose the region closest to primary users (e.g., `Singapore` or `Frankfurt`).
   - **Plan**: `Standard` (with automated backups enabled).
3. Connect via `psql` to enable the PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. Copy the internal and external connection strings (`DATABASE_URL`).

### 2.2 Managed Redis
1. In the Render Dashboard, create a new **Redis** instance.
2. Settings:
   - **Name**: `pathpulse-redis-prod`
   - **Plan**: `Starter` or `Standard` with persistence enabled.
3. Copy the internal connection URL (`REDIS_URL`).

### 2.3 AI Suggestion Service (`apps/ai-service`)
1. Create a new **Web Service** on Render connected to the repository.
2. Settings:
   - **Name**: `pathpulse-ai-service`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `apps/ai-service/Dockerfile`
   - **Docker Context**: `apps/ai-service`
   - **Health Check Path**: `/health`
   - **Plan**: `Standard` (minimum 1GB RAM for scikit-learn model inference).
3. Environment Variables:
   | Variable | Value / Purpose |
   | :--- | :--- |
   | `AI_SERVICE_TOKEN` | Cryptographically random secret shared with API (`openssl rand -hex 32`) |
   | `MODEL_VERSION` | `pathpulse-classifier-v1.0.0` |
   | `PORT` | `8000` |
   | `SENTRY_DSN` | Sentry DSN for AI service error monitoring (optional) |

### 2.4 Core Backend API (`apps/api`)
1. Create a new **Web Service** on Render connected to the repository.
2. Settings:
   - **Name**: `pathpulse-api`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Docker Context**: Root of repository (`.`)
   - **Pre-Deploy Command**: `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`
   - **Health Check Path**: `/api/v1/health`
3. Environment Variables:
   | Variable | Value / Description |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | Render Internal PostgreSQL connection URL |
   | `REDIS_URL` | Render Internal Redis connection URL |
   | `JWT_SECRET` | Cryptographically random secret (`openssl rand -base64 48`) |
   | `JWT_EXPIRATION` | `900` (15 minutes in seconds) |
   | `REFRESH_TOKEN_SECRET` | Cryptographically random secret (`openssl rand -base64 48`) |
   | `REFRESH_TOKEN_EXPIRATION` | `604800` (7 days in seconds) |
   | `WEB_ORIGIN` | `https://pathpulse.org` (Vercel custom production domain) |
   | `S3_ENDPOINT` | Production S3 endpoint (or AWS region URL) |
   | `S3_REGION` | AWS region (e.g., `ap-south-1`) |
   | `S3_ACCESS_KEY` | IAM user access key for evidence upload |
   | `S3_SECRET_KEY` | IAM user secret access key |
   | `S3_BUCKET` | Dedicated evidence bucket name (`pathpulse-prod-evidence`) |
   | `AI_SERVICE_URL` | `http://pathpulse-ai-service:8000` (Render internal service network) |
   | `AI_SERVICE_TOKEN` | Identical token matching the AI service secret |
   | `SENTRY_DSN` | Sentry Node.js DSN |

---

## 3. Web Frontend Deployment on Vercel

1. In the Vercel Dashboard, import the Git repository.
2. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm --filter @pathpulse/web build`
   - **Output Directory**: Automatically inferred by Next.js
3. Environment Variables:
   | Variable | Value / Description |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://api.pathpulse.org` |
   | `NEXT_PUBLIC_WS_URL` | `wss://api.pathpulse.org` |
   | `NEXT_PUBLIC_APP_ENV` | `production` |
   | `NEXT_PUBLIC_SENTRY_DSN` | Sentry Next.js DSN for browser & server error capture |
4. Domain Configuration:
   - Assign production domain `pathpulse.org` and `www.pathpulse.org`.
   - Ensure Vercel SSL certificate auto-renews.

---

## 4. Verification and Staging Smoke Tests

Once deployed, verify the live deployment using these sequential checks:

1. **API Health & Version**:
   ```bash
   curl -f https://api.pathpulse.org/api/v1/health
   # Expected: {"status":"ok","database":"connected","redis":"ok","uptime":...,"version":"0.1.0"}
   ```

2. **API Deep Readiness & Migrations**:
   ```bash
   curl -f https://api.pathpulse.org/api/v1/health/ready
   # Expected: {"status":"ready"} (HTTP 200)
   ```

3. **AI Service Health**:
   ```bash
   curl -f https://ai.pathpulse.org/health
   # Expected: {"status":"ok","version":"pathpulse-classifier-v1.0.0"}
   ```

4. **Web Security Headers**:
   ```bash
   curl -I https://pathpulse.org
   # Verify CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
   ```

---

## 5. Next Steps for the Operator

Because automated hosting deployment requires external account access and live cloud credentials that are not present in this build environment, execute the following steps to complete final hosting activation:

1. **Create Render Account & Services**: Follow Section 2 above to create PostgreSQL, Redis, AI service, and API services on [render.com](https://render.com).
2. **Create Vercel Project**: Follow Section 3 above to import `apps/web` on [vercel.com](https://vercel.com).
3. **Configure CI Secrets in GitHub**:
   - In GitHub repository settings under `Settings > Secrets and variables > Actions`, add:
     - `DATABASE_URL`: Production PostgreSQL URL
     - `RENDER_API_DEPLOY_HOOK`: Deploy hook URL from Render API service
     - `RENDER_AI_DEPLOY_HOOK`: Deploy hook URL from Render AI service
     - `VERCEL_DEPLOY_HOOK`: Deploy hook URL from Vercel Web project
4. **Trigger Initial Release**: Push a commit or trigger the `CI/CD Pipeline` manually in GitHub Actions to run the full verification matrix, execute migrations, and deploy containers.
