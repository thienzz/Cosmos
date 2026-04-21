# Cosmos Explorer — Release & Deployment Procedures

**Document:** 32 — Release & Deployment Procedures  
**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Published  
**Product:** Cosmos Explorer — Interactive 3D Universe Visualization  
**Depends On:** Doc 25 (Backend Architecture §18), Doc 28 (Developer Setup §12), Doc 29 (Security), Doc 31 (Observability)  
**Consumed By:** Engineering team, DevOps, release manager

---

## Table of Contents

1. [Release Strategy](#1-release-strategy)
2. [Environments](#2-environments)
3. [Frontend Deployment](#3-frontend-deployment)
4. [Backend Deployment](#4-backend-deployment)
5. [Data Deployment (ETL)](#5-data-deployment-etl)
6. [Release Checklist](#6-release-checklist)
7. [Rollback Procedures](#7-rollback-procedures)
8. [Feature Flags](#8-feature-flags)
9. [Hotfix Process](#9-hotfix-process)
10. [Post-Deployment Verification](#10-post-deployment-verification)

---

## 1. Release Strategy

### 1.1 Release Cadence

| Release Type | Frequency | Scope | Approval |
|-------------|-----------|-------|----------|
| Patch (v1.0.x) | As needed | Bug fixes, security patches | 1 engineer |
| Minor (v1.x.0) | Bi-weekly sprint | Features, improvements | Engineering lead |
| Major (vX.0.0) | Quarterly | Breaking changes, architecture shifts | Product + Engineering |
| Hotfix | Emergency | Critical bug/security | On-call engineer |
| Data update | Per ETL schedule | Catalog data refresh | Automated + validation |

### 1.2 Versioning

Semantic Versioning 2.0 (`MAJOR.MINOR.PATCH`):
- **MAJOR**: Breaking API changes, new scale regime, major UI overhaul
- **MINOR**: New features, new entity types, new modes
- **PATCH**: Bug fixes, performance improvements, dependency updates

Data has separate versioning: `YYYY.Q{quarter}.{revision}` (e.g., `2026.Q1.3`).

### 1.3 Release Branch Flow

```
develop ────→ release/v1.2.0 ────→ main ────→ tag v1.2.0
                    │                            │
                    ├── fix: last-minute bug ─────┤
                    │                            │
                    └── version bump ─────────────┘
```

---

## 2. Environments

### 2.1 Environment Matrix

| Environment | URL | Purpose | Deploy Trigger | Data |
|------------|-----|---------|---------------|------|
| Local | localhost:5173 | Development | Manual | Seed (10K stars) |
| Preview | pr-{n}.preview.cosmosexplorer.app | PR review | Auto on PR push | Seed |
| Staging | staging.cosmosexplorer.app | Integration testing | Auto on merge to develop | Full (1.8B stars) |
| Production | cosmosexplorer.app | Live users | Manual approval | Full |

### 2.2 Environment Parity

Staging mirrors production as closely as possible:
- Same Kubernetes cluster configuration (different namespace)
- Same database schema (separate instance with full data)
- Same CDN configuration (separate distribution)
- Same monitoring and alerting (separate dashboards)
- Differences: reduced replica count, smaller instance types, no WAF geographic rules

---

## 3. Frontend Deployment

### 3.1 Build Pipeline

```
Source Code → TypeScript Check → ESLint → Vite Build → Bundle Analyze → Upload to CDN → Invalidate Cache
```

**Build steps:**

```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Type check
pnpm --filter web typecheck

# 3. Lint
pnpm --filter web lint

# 4. Unit tests
pnpm --filter web test --run

# 5. Production build
pnpm --filter web build
# Output: apps/web/dist/ (~8 MB uncompressed, ~500 KB gzipped JS)

# 6. Bundle size check
pnpm --filter web build:analyze
# Fail if JS bundle > 500 KB gzipped

# 7. Upload to S3
aws s3 sync apps/web/dist/ s3://cosmos-explorer-web-${ENV}/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.json"

# 8. Upload index.html with short cache
aws s3 cp apps/web/dist/index.html s3://cosmos-explorer-web-${ENV}/index.html \
  --cache-control "public, max-age=300"

# 9. Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id ${CF_DISTRIBUTION_ID} \
  --paths "/index.html" "/manifest.json"
```

### 3.2 Asset Caching Strategy

| Asset | Cache-Control | Rationale |
|-------|--------------|-----------|
| `index.html` | `max-age=300` (5 min) | Must update quickly for new deploys |
| `*.js`, `*.css` (hashed) | `max-age=31536000, immutable` | Content-addressed; never changes |
| `*.woff2` (fonts) | `max-age=31536000, immutable` | Static; content-addressed |
| `*.glsl` (shaders) | `max-age=86400` | May change between versions |
| Tile manifest | `max-age=3600` | Updated on data deploys |

### 3.3 Rollback

Frontend rollback is simple: redeploy the previous build artifacts from S3 versioning:

```bash
# List previous versions of index.html
aws s3api list-object-versions --bucket cosmos-explorer-web-prod --prefix index.html

# Restore previous version
aws s3api copy-object \
  --bucket cosmos-explorer-web-prod \
  --key index.html \
  --copy-source "cosmos-explorer-web-prod/index.html?versionId=${PREV_VERSION_ID}"

# Invalidate
aws cloudfront create-invalidation --distribution-id ${CF_DISTRIBUTION_ID} --paths "/*"
```

---

## 4. Backend Deployment

### 4.1 Container Build & Push

```bash
# Build images with Git SHA tag
docker build -t cosmos-api:${GIT_SHA} -f infra/docker/Dockerfile.api .
docker build -t cosmos-tile:${GIT_SHA} -f infra/docker/Dockerfile.tile-server .
docker build -t cosmos-ephemeris:${GIT_SHA} -f infra/docker/Dockerfile.ephemeris .

# Scan for vulnerabilities
trivy image cosmos-api:${GIT_SHA} --severity CRITICAL,HIGH --exit-code 1

# Push to ECR
docker tag cosmos-api:${GIT_SHA} ${ECR_REGISTRY}/cosmos-api:${GIT_SHA}
docker push ${ECR_REGISTRY}/cosmos-api:${GIT_SHA}
```

### 4.2 Kubernetes Rolling Deployment

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cosmos-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: api
          image: ${ECR_REGISTRY}/cosmos-api:${GIT_SHA}
          readinessProbe:
            httpGet: { path: /ready, port: 3000 }
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 15
            periodSeconds: 30
          resources:
            requests: { cpu: 500m, memory: 512Mi }
            limits: { cpu: 2000m, memory: 2Gi }
```

**Deployment steps:**
1. Apply new deployment manifest: `kubectl apply -f k8s/api-deployment.yaml`
2. Kubernetes creates new pod with updated image
3. New pod passes readiness probe → added to load balancer
4. Old pod drained (no new connections) → terminated
5. Repeat for all replicas (one at a time, `maxUnavailable: 0`)

### 4.3 Database Migrations

Migrations run as a Kubernetes Job before the deployment:

```bash
# 1. Run migration job
kubectl apply -f k8s/migration-job.yaml
# Job runs: pnpm --filter api migrate:up

# 2. Wait for completion
kubectl wait --for=condition=complete job/cosmos-migration --timeout=300s

# 3. Verify
kubectl logs job/cosmos-migration

# 4. Proceed with deployment
kubectl apply -f k8s/api-deployment.yaml
```

**Migration safety rules:**
- Additive only in production (add columns, add tables, add indexes)
- Column removal requires 2-release cycle: (1) stop using column, (2) drop column in next release
- No `ALTER TABLE ... ALTER COLUMN` on large tables without testing on staging first
- Lock timeout set to 5 seconds; if migration can't acquire lock, it retries

### 4.4 Backend Rollback

```bash
# Option 1: Roll back deployment to previous revision
kubectl rollout undo deployment/cosmos-api

# Option 2: Pin to specific image
kubectl set image deployment/cosmos-api api=${ECR_REGISTRY}/cosmos-api:${PREV_GIT_SHA}

# Verify rollback
kubectl rollout status deployment/cosmos-api
```

**Database migration rollback:**
```bash
# Run down migration
kubectl create job cosmos-rollback --image=${ECR_REGISTRY}/cosmos-api:${PREV_GIT_SHA} \
  -- pnpm --filter api migrate:down
```

---

## 5. Data Deployment (ETL)

### 5.1 Blue-Green Data Switch

Per Doc 25 §8.3:

```
1. ETL writes to staging tables       → stars_staging, entities_staging
2. Validation tests run               → TS-DATA suite against staging
3. If passed: atomic table swap        → RENAME in transaction
4. CDN tile deploy (versioned paths)   → /tiles/v2026.Q1.3/...
5. Manifest update                     → New manifest with new tile URLs
6. WebSocket broadcast                 → data_version_update event
7. Client refreshes manifest           → Discovers new tiles
8. Old data retained 7 days            → Dropped by scheduled job
```

### 5.2 Data Validation Before Promotion

Before promoting staging data to production, the following gates must pass:

| Gate | Check | Threshold |
|------|-------|-----------|
| Row counts | Stars, galaxies, nebulae, clusters | Within ±5% of previous |
| Null rates | RA, Dec, magnitude columns | <0.1% null |
| Range checks | RA [0,360), Dec [-90,90], magnitude [-30,30] | 0 violations |
| Cross-reference | 100 random stars vs Gaia DR3 | RA/Dec within 0.001° |
| Tile integrity | Decode 100 random tiles | All parse without error |
| Search index | Reindex + test 50 known entities | All found, correct scores |

### 5.3 Data Rollback

If post-switch issues are detected:

```sql
-- Atomic rollback (within 7-day retention window)
BEGIN;
  ALTER TABLE entities RENAME TO entities_bad;
  ALTER TABLE entities_old RENAME TO entities;
  ALTER TABLE stars RENAME TO stars_bad;
  ALTER TABLE stars_old RENAME TO stars;
COMMIT;
```

CDN: Revert to previous tile version by updating manifest to point to old paths.

---

## 6. Release Checklist

### 6.1 Pre-Release Checklist

| # | Check | Owner | Status |
|---|-------|-------|--------|
| 1 | All CI checks pass on release branch | Engineer | ☐ |
| 2 | No Critical/High Sentry errors in staging | QA | ☐ |
| 3 | E2E tests pass against staging | CI | ☐ |
| 4 | Visual QA tests pass (ΔE, SSIM, pHash) | CI | ☐ |
| 5 | Performance tests pass (FPS, bundle size, latency) | CI | ☐ |
| 6 | Accessibility audit passes (axe-core) | CI | ☐ |
| 7 | Database migrations tested on staging | Engineer | ☐ |
| 8 | Rollback procedure tested on staging | DevOps | ☐ |
| 9 | Changelog generated from commits | Release Manager | ☐ |
| 10 | Version bumped in package.json files | Engineer | ☐ |
| 11 | Security scan passes (npm audit, Trivy) | CI | ☐ |
| 12 | Error budget >20% | SRE | ☐ |

### 6.2 Deployment Sequence

```
1. Merge release branch to main
2. Tag release: git tag v1.2.0
3. Run database migrations (if any)
4. Deploy backend services (rolling update)
5. Verify backend health (/health, /ready)
6. Deploy frontend (S3 + CloudFront)
7. Verify frontend loads correctly
8. Run smoke tests against production
9. Monitor dashboards for 30 minutes
10. Announce release (Slack, changelog)
```

### 6.3 Post-Release Checklist

| # | Check | Window | Owner |
|---|-------|--------|-------|
| 1 | No spike in Sentry errors | 30 min | On-call |
| 2 | API error rate <0.5% | 1 hour | On-call |
| 3 | FPS metrics normal | 1 hour | On-call |
| 4 | No rate limit anomalies | 1 hour | On-call |
| 5 | Tile cache warming normally | 2 hours | On-call |
| 6 | User traffic patterns normal | 24 hours | Product |

---

## 7. Rollback Procedures

### 7.1 Decision Matrix

| Symptom | Severity | Action |
|---------|----------|--------|
| API 5xx rate >5% | SEV-1 | Immediate backend rollback |
| Frontend crash loop | SEV-1 | Immediate frontend rollback |
| Data corruption detected | SEV-1 | Data rollback + backend rollback |
| API latency >5s P95 | SEV-2 | Backend rollback within 15 min |
| Visual rendering broken | SEV-2 | Frontend rollback within 15 min |
| Feature regression | SEV-3 | Feature flag disable; rollback in next deploy |
| Performance degradation (<10%) | SEV-4 | Investigate; roll back in next patch if needed |

### 7.2 Rollback Authority

| Severity | Who Can Authorize |
|----------|------------------|
| SEV-1 | Any on-call engineer (immediate) |
| SEV-2 | Engineering lead or on-call engineer |
| SEV-3 | Engineering lead (next business day) |
| SEV-4 | Team consensus |

---

## 8. Feature Flags

### 8.1 Implementation

Feature flags using environment variables and runtime configuration:

```typescript
const featureFlags = {
  ENABLE_WEBGPU: import.meta.env.VITE_FF_WEBGPU === 'true',
  ENABLE_FITS_UPLOAD: import.meta.env.VITE_FF_FITS === 'true',
  ENABLE_COSMIC_WEB: import.meta.env.VITE_FF_COSMIC_WEB === 'true',
  ENABLE_AUDIO: import.meta.env.VITE_FF_AUDIO === 'true',
  ENABLE_EXPORT: import.meta.env.VITE_FF_EXPORT === 'true',
};
```

### 8.2 Flag Lifecycle

```
1. Feature developed behind flag (disabled by default)
2. Enabled on staging for testing
3. Enabled on production (gradual rollout if available)
4. Monitoring period (1–2 weeks)
5. Flag removed; feature becomes permanent
```

### 8.3 Emergency Kill Switches

Critical features have server-side kill switches that can be toggled without deployment:

| Flag | Effect | Toggle Method |
|------|--------|---------------|
| `DISABLE_SEARCH` | Returns empty results | Redis config key |
| `DISABLE_EXPORTS` | Returns 503 on export endpoints | Redis config key |
| `DISABLE_FITS` | Returns 503 on FITS endpoints | Redis config key |
| `MAINTENANCE_MODE` | Returns 503 on all endpoints except /health | Redis config key |

---

## 9. Hotfix Process

### 9.1 Hotfix Flow

```
1. Identify critical issue in production
2. Create hotfix branch from main: hotfix/v1.2.1-fix-tile-crash
3. Apply minimal fix (no feature work)
4. Run abbreviated CI (lint + unit tests + affected integration tests)
5. Code review (1 approval, expedited)
6. Merge to main + back-merge to develop
7. Tag: git tag v1.2.1
8. Deploy immediately (skip staging if SEV-1)
9. Post-mortem within 48 hours
```

### 9.2 Hotfix Authority

- SEV-1: On-call engineer can deploy hotfix without staging validation
- SEV-2: Engineering lead approval required; staging validation recommended but can be skipped
- All hotfixes must be back-merged to develop within 24 hours

---

## 10. Post-Deployment Verification

### 10.1 Smoke Tests

Automated smoke tests run against production after every deployment:

```bash
# Smoke test script
curl -sf https://api.cosmosexplorer.app/v1/health | jq '.status == "healthy"'
curl -sf https://api.cosmosexplorer.app/v1/version | jq '.data.api_version'
curl -sf https://api.cosmosexplorer.app/v1/entities/ent/ENT-1001 | jq '.data.name == "Sirius"'
curl -sf https://api.cosmosexplorer.app/v1/search?q=orion | jq '.data | length > 0'
curl -sf https://api.cosmosexplorer.app/v1/tiles/manifest | jq '.data.version'
curl -sf https://cosmosexplorer.app/ -o /dev/null -w "%{http_code}" | grep 200
```

### 10.2 Canary Monitoring

For the first 30 minutes after deployment, enhanced monitoring:
- API error rate sampled every 15 seconds (normal: every 1 minute)
- Sentry alert threshold reduced to 10 errors/min (normal: 50)
- Tile cache hit rate monitored for anomalies
- On-call engineer watches dashboards actively

### 10.3 Automated Rollback Trigger

If during the 30-minute canary window:
- API 5xx rate exceeds 3% → automatic rollback triggered
- Frontend Sentry errors exceed 100/min → alert to on-call for manual decision

---

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-19 | System | Initial release and deployment procedures |

---

*Document 32 of 33 — Cosmos Explorer Technical Documentation Suite*  
*Cross-references: Doc 25 (Backend Architecture §18), Doc 28 (Developer Setup), Doc 29 (Security), Doc 31 (Observability)*
