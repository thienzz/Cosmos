# Cosmos Explorer — Observability & Analytics Specification

**Document:** 31 — Observability & Analytics Specification  
**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Published  
**Product:** Cosmos Explorer — Interactive 3D Universe Visualization  
**Depends On:** Doc 25 (Backend Architecture §14), Doc 27 (Frontend State §14), Doc 29 (Security)  
**Consumed By:** Doc 32 (Release & Deployment), Doc 28 (Developer Setup)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Backend Observability](#2-backend-observability)
3. [Frontend Observability](#3-frontend-observability)
4. [Alerting](#4-alerting)
5. [Dashboards](#5-dashboards)
6. [Product Analytics](#6-product-analytics)
7. [Data Pipeline Monitoring](#7-data-pipeline-monitoring)
8. [SLIs, SLOs & Error Budgets](#8-slis-slos--error-budgets)
9. [Log Management](#9-log-management)
10. [Distributed Tracing](#10-distributed-tracing)

---

## 1. Overview

### 1.1 Observability Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Metrics | Prometheus + Grafana | Backend service metrics, custom counters |
| Logging | Structured JSON → CloudWatch / Loki | Centralized log aggregation |
| Tracing | OpenTelemetry → Jaeger | Distributed request tracing |
| Error tracking | Sentry | Frontend + backend exception capture |
| Uptime monitoring | UptimeRobot or Checkly | External health checks |
| Product analytics | PostHog (self-hosted) or Plausible | Privacy-respecting usage analytics |
| Real User Monitoring | Sentry Performance | Frontend Core Web Vitals, FPS |

### 1.2 Principles

- **Structured logging**: All logs are JSON with consistent fields — never free-form text
- **Cardinality control**: Metric labels bounded to prevent Prometheus explosion
- **Privacy by design**: No PII in logs or metrics; analytics are anonymized or consent-based
- **Cost awareness**: Log retention tiered by importance; sampling for high-volume tracing

---

## 2. Backend Observability

### 2.1 Prometheus Metrics

Each backend service exposes `/metrics` in Prometheus exposition format.

**API Gateway Metrics:**

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `api_requests_total` | counter | `method`, `endpoint`, `status`, `tier` | Total API requests |
| `api_request_duration_seconds` | histogram | `method`, `endpoint` | Request latency (buckets: 5ms–10s) |
| `api_request_size_bytes` | histogram | `endpoint` | Request body size |
| `api_response_size_bytes` | histogram | `endpoint` | Response body size |
| `api_active_connections` | gauge | — | Current open connections |
| `api_rate_limit_hits_total` | counter | `tier` | Rate limit 429 responses |
| `api_errors_total` | counter | `endpoint`, `error_code` | Application errors by code |

**Tile Server Metrics:**

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `tile_requests_total` | counter | `tile_type`, `cache_hit` | Tile requests (star/galaxy/cosmic) |
| `tile_latency_seconds` | histogram | `tile_type`, `cache_hit` | Tile serving latency |
| `tile_cache_size_bytes` | gauge | — | Redis tile cache size |
| `tile_cache_hit_ratio` | gauge | `tile_type` | Cache hit rate (sliding window) |
| `tile_bytes_served_total` | counter | `tile_type` | Total bytes served |
| `tile_concurrent_connections` | gauge | — | Active tile connections |

**Ephemeris Service Metrics:**

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `ephemeris_computations_total` | counter | `endpoint` | Total computations (single/batch/range) |
| `ephemeris_computation_seconds` | histogram | `endpoint` | Compute latency |
| `ephemeris_cache_hit_ratio` | gauge | — | Redis cache hit rate |
| `ephemeris_bodies_per_request` | histogram | — | Bodies requested per batch |

**Database Metrics (pg_exporter):**

| Metric | Type | Description |
|--------|------|-------------|
| `pg_connections_active` | gauge | Active PostgreSQL connections |
| `pg_query_duration_seconds` | histogram | Query latency |
| `pg_table_rows` | gauge | Row counts per table |
| `pg_replication_lag_seconds` | gauge | Replication lag (if replicas) |
| `pg_deadlocks_total` | counter | Deadlock events |

### 2.2 Health Checks

Every service exposes:
- `GET /health` — Returns 200 if service can serve requests; 503 if degraded
- `GET /ready` — Returns 200 only when fully initialized (DB connected, caches warmed)

Kubernetes uses `/health` for liveness probes (restart on failure) and `/ready` for readiness probes (remove from LB on failure).

---

## 3. Frontend Observability

### 3.1 Sentry Integration

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION,
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysSessionSampleRate: 0.01,  // 1% of sessions
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
});
```

### 3.2 Custom Frontend Metrics

Reported to Sentry Performance or custom endpoint:

| Metric | Type | Description |
|--------|------|-------------|
| `fps_current` | gauge | Current frames per second |
| `fps_average_30s` | gauge | 30-second rolling average FPS |
| `draw_calls_per_frame` | gauge | Three.js draw calls |
| `triangles_per_frame` | gauge | Triangles rendered |
| `gpu_memory_used_mb` | gauge | Estimated GPU memory usage |
| `js_heap_size_mb` | gauge | JavaScript heap size |
| `tiles_loaded` | gauge | Number of tiles in GPU memory |
| `tiles_pending` | gauge | Tiles currently fetching |
| `tile_cache_hit_rate` | gauge | IndexedDB cache hit ratio |
| `worker_pool_utilization` | gauge | Fraction of workers busy |
| `web_vitals_fcp` | timing | First Contentful Paint |
| `web_vitals_lcp` | timing | Largest Contentful Paint |
| `web_vitals_tti` | timing | Time to Interactive |
| `web_vitals_cls` | metric | Cumulative Layout Shift |

### 3.3 Error Boundary Reporting

React error boundaries (Doc 27 §15) report to Sentry with context:

```typescript
class EngineErrorBoundary extends React.Component {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        engine: {
          renderer_info: renderer.info,
          camera_position: cameraStore.getState().position,
          scale_regime: cameraStore.getState().scaleRegime,
          active_mode: modeStore.getState().activeMode,
        },
      },
    });
  }
}
```

### 3.4 WebGL Context Loss Tracking

```typescript
canvas.addEventListener('webglcontextlost', () => {
  Sentry.captureMessage('WebGL context lost', {
    level: 'error',
    contexts: {
      gpu: {
        renderer: gl.getParameter(gl.RENDERER),
        vendor: gl.getParameter(gl.VENDOR),
        tiles_loaded: tileStore.getState().tilesInMemory,
        gpu_memory_mb: tileStore.getState().gpuMemoryUsedBytes / 1e6,
      },
    },
  });
});
```

---

## 4. Alerting

### 4.1 Alert Rules

| Alert | Condition | Severity | Channel | Auto-resolve |
|-------|-----------|----------|---------|-------------|
| API High Error Rate | 5xx rate > 1% for 5 min | SEV-2 | PagerDuty | Yes, when <0.5% |
| API High Latency | P99 > 2s for 5 min | SEV-2 | PagerDuty | Yes, when P99 <1s |
| Tile Server Down | Health check fails 3 consecutive | SEV-1 | PagerDuty | Yes, on recovery |
| Tile Cache Miss Spike | Hit ratio < 50% for 10 min | SEV-3 | Slack | Yes |
| Rate Limit Surge | 429 responses > 100/min | SEV-3 | Slack | Yes |
| Database Connection Pool | Active > 80% of max | SEV-2 | PagerDuty | Yes |
| Database Replication Lag | > 30 seconds | SEV-2 | PagerDuty | Yes |
| Elasticsearch Cluster Red | Cluster health = red | SEV-1 | PagerDuty | Yes |
| ETL Pipeline Failed | DAG run status = failed | SEV-2 | Slack + email | Manual |
| Certificate Expiry | < 14 days to expiry | SEV-3 | Email | Yes, on renewal |
| Frontend Error Spike | Sentry errors > 50/min | SEV-2 | Slack | Yes |
| WebGL Context Loss Spike | > 10 events/hour | SEV-3 | Slack | Yes |

### 4.2 Alert Routing

```yaml
# alertmanager.yml (simplified)
route:
  receiver: default-slack
  routes:
    - match: { severity: sev-1 }
      receiver: pagerduty-critical
      repeat_interval: 5m
    - match: { severity: sev-2 }
      receiver: pagerduty-warning
      repeat_interval: 15m
    - match: { severity: sev-3 }
      receiver: slack-engineering
      repeat_interval: 1h

receivers:
  - name: pagerduty-critical
    pagerduty_configs:
      - service_key: ${PD_CRITICAL_KEY}
  - name: pagerduty-warning
    pagerduty_configs:
      - service_key: ${PD_WARNING_KEY}
  - name: slack-engineering
    slack_configs:
      - channel: '#cosmos-alerts'
```

### 4.3 Alert Silencing

- Scheduled maintenance windows suppress non-critical alerts
- ETL pipeline alerts silenced during known data update windows
- Manual silencing requires justification comment (audit trail)

---

## 5. Dashboards

### 5.1 Dashboard Inventory

| Dashboard | Audience | Update Interval | Key Panels |
|-----------|----------|----------------|------------|
| **API Overview** | Engineering | 15s | Request rate, latency P50/P95/P99, error rate, top endpoints |
| **Tile Server** | Engineering | 15s | Tile requests/s, cache hit rate, bytes served, latency |
| **Ephemeris Service** | Engineering | 30s | Computations/s, latency, cache hit rate |
| **Database Health** | DevOps | 30s | Connections, query latency, table sizes, replication lag |
| **Frontend Performance** | Engineering | 1m | FPS distribution, Core Web Vitals, JS heap, WebGL errors |
| **ETL Pipeline** | Data Engineering | 5m | DAG run history, duration trends, data volume, row counts |
| **Business Metrics** | Product/Leadership | 1h | DAU, sessions, top entities, search terms, export count |
| **Security** | Security | 1m | Rate limit hits, blocked requests, error codes, auth failures |
| **Cost** | Management | 1d | Compute, storage, bandwidth, CDN, database costs |

### 5.2 API Overview Dashboard Panels

1. **Request Rate** — `rate(api_requests_total[5m])` by endpoint
2. **Error Rate** — `rate(api_requests_total{status=~"5.."}[5m]) / rate(api_requests_total[5m])`
3. **Latency Heatmap** — `api_request_duration_seconds` histogram
4. **Top Endpoints** — Table sorted by request count
5. **Rate Limit Activity** — `rate(api_rate_limit_hits_total[5m])` by tier
6. **Active Connections** — `api_active_connections`
7. **Bandwidth** — `rate(api_response_size_bytes_sum[5m])`

### 5.3 Tile Server Dashboard Panels

1. **Tile Request Rate** — by tile_type (star/galaxy/cosmic)
2. **Cache Hit Rate** — `tile_cache_hit_ratio` over time
3. **Tile Latency** — P50/P95/P99 by cache_hit (true/false)
4. **Redis Cache Size** — `tile_cache_size_bytes`
5. **Bandwidth Out** — `rate(tile_bytes_served_total[5m])`
6. **Concurrent Connections** — `tile_concurrent_connections`

---

## 6. Product Analytics

### 6.1 Privacy-Respecting Analytics

Analytics use PostHog (self-hosted) or Plausible with:
- No cookies (first-party data only)
- IP addresses hashed, not stored
- Opt-in consent banner (required for GDPR)
- Data retained 12 months, then automatically deleted
- No third-party trackers or advertising pixels

### 6.2 Events Tracked

| Event | Properties | Purpose |
|-------|-----------|---------|
| `page_load` | load_time_ms, gpu_tier, browser, viewport_size | Performance baseline |
| `entity_selected` | ent_id, category, source (click/search/tour) | Content engagement |
| `search_performed` | query_length, category_filter, result_count | Search effectiveness |
| `mode_changed` | from_mode, to_mode | Feature adoption |
| `tour_started` | tour_id | Education engagement |
| `tour_completed` | tour_id, duration_s | Tour completion rate |
| `tour_abandoned` | tour_id, step_reached, total_steps | Drop-off analysis |
| `bookmark_created` | entity_category | Feature usage |
| `export_requested` | format, resolution | Export adoption |
| `time_slider_used` | duration_s, speed_setting | Time feature engagement |
| `scale_transition` | from_regime, to_regime | Navigation patterns |
| `session_duration` | duration_s, entities_viewed, searches_performed | Engagement depth |
| `performance_degraded` | fps_average, gpu_tier, action_taken | Quality of experience |
| `error_displayed` | error_type, component | Error frequency |

### 6.3 Key Product Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| Daily Active Users (DAU) | Unique sessions per day | Growing MoM |
| Session Duration (median) | Time from first to last interaction | >5 minutes |
| Entities Explored / Session | Distinct entities selected | >3 |
| Tour Completion Rate | Tours completed / tours started | >60% |
| Search Success Rate | Searches leading to entity selection | >70% |
| Return Rate (7-day) | Users returning within 7 days | >25% |
| Export Usage | Sessions with ≥1 export | >5% |
| Error Rate (user-visible) | Sessions with ≥1 visible error | <2% |

---

## 7. Data Pipeline Monitoring

### 7.1 ETL Pipeline Metrics

Airflow provides built-in metrics via StatsD, forwarded to Prometheus:

| Metric | Description |
|--------|-------------|
| `airflow_dag_run_duration_seconds` | Duration of each DAG run |
| `airflow_task_duration_seconds` | Duration of each task |
| `airflow_task_fail_total` | Failed task count |
| `airflow_pool_open_slots` | Available worker slots |

### 7.2 Data Quality Gates

After each ETL run, automated checks verify:

| Check | Threshold | Action on Failure |
|-------|-----------|------------------|
| Row count delta | <±5% from previous | Alert SEV-3; block promotion to production |
| Null rate (critical columns) | <0.1% for RA, Dec, magnitude | Alert SEV-2; block promotion |
| Coordinate range | RA [0,360), Dec [-90,90] | Alert SEV-2; reject batch |
| Distance sanity | <50 kpc for stars, <10 Gpc for galaxies | Alert SEV-3; flag outliers |
| Tile count delta | <±10% from previous | Alert SEV-3 |
| Checksum verification | All source files match published checksums | Alert SEV-1; abort ETL |

### 7.3 Blue-Green Data Deploy Monitoring

During the blue-green data switch (Doc 25 §8.3), monitor:
- Staging validation test results before swap
- Swap duration (target: <5 seconds for atomic rename)
- CDN invalidation completion time
- Client manifest refresh rate (WebSocket `data_version_update` delivery)
- Rollback readiness (old data retained 7 days)

---

## 8. SLIs, SLOs & Error Budgets

### 8.1 Service Level Indicators

| SLI | Measurement | Good Threshold |
|-----|------------|---------------|
| API Availability | `1 - (5xx responses / total responses)` | >99.9% |
| API Latency | P95 of `api_request_duration_seconds` | <500ms |
| Tile Latency | P95 of `tile_latency_seconds` | <100ms |
| Tile Availability | `1 - (tile 5xx / total tile requests)` | >99.95% |
| Search Latency | P95 of search endpoint latency | <200ms |
| Frontend Error Rate | `1 - (sessions with JS error / total sessions)` | >98% |
| FPS Quality | % of frames ≥55 FPS on mid-tier GPU | >95% |

### 8.2 Service Level Objectives

| Service | SLO | Window | Error Budget |
|---------|-----|--------|-------------|
| API | 99.9% availability | 30-day rolling | 43 min downtime/month |
| Tile Server | 99.95% availability | 30-day rolling | 22 min downtime/month |
| Search | 99.9% availability | 30-day rolling | 43 min downtime/month |
| Ephemeris | 99.5% availability | 30-day rolling | 3.6 hr downtime/month |
| Frontend | <2% error rate | 7-day rolling | 2% of sessions |

### 8.3 Error Budget Policy

- **Budget remaining >50%**: Normal development velocity; feature work prioritized
- **Budget remaining 20–50%**: Increase reliability work; add monitoring for at-risk areas
- **Budget remaining <20%**: Feature freeze; all engineering effort on reliability
- **Budget exhausted**: Incident review required; post-mortem before new feature work

---

## 9. Log Management

### 9.1 Structured Log Format

All services emit JSON logs:

```json
{
  "timestamp": "2026-04-19T12:00:00.123Z",
  "level": "info",
  "service": "api-gateway",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/v1/entities/5072708048",
  "status": 200,
  "duration_ms": 12,
  "tier": "anonymous",
  "user_agent": "Mozilla/5.0...",
  "ip_hash": "a1b2c3d4"
}
```

### 9.2 Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `error` | Unexpected failures requiring attention | Database connection failure, unhandled exception |
| `warn` | Expected but noteworthy conditions | Rate limit hit, degraded cache |
| `info` | Normal operations, request completion | Request served, ETL step completed |
| `debug` | Detailed diagnostic info (dev/staging only) | Query plan, cache key, tile address |

### 9.3 Retention

| Log Source | Retention | Storage |
|------------|-----------|---------|
| API request logs | 30 days | CloudWatch / Loki |
| Error logs | 90 days | CloudWatch / Loki |
| ETL pipeline logs | 90 days | S3 + CloudWatch |
| Security/audit logs | 1 year | S3 (encrypted, immutable) |
| Debug logs | 7 days (staging only) | Loki |

### 9.4 PII Scrubbing

Before log emission, scrub:
- IP addresses → SHA-256 hash (first 8 hex chars)
- Email addresses → `u***@domain.com`
- API keys → `ce_***_{last4}`
- User-Agent → retained (not PII, useful for debugging)

---

## 10. Distributed Tracing

### 10.1 OpenTelemetry Configuration

```typescript
// tracing.ts (API Gateway)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({ endpoint: 'http://jaeger:14268/api/traces' }),
  instrumentations: [
    new HttpInstrumentation(),
    new PgInstrumentation(),
  ],
  sampler: new TraceIdRatioBasedSampler(0.05),  // 5% sampling
});
```

### 10.2 Trace Propagation

Request traces propagate across services via `traceparent` header (W3C Trace Context):

```
Client → API Gateway → PostgreSQL
       → API Gateway → Elasticsearch
       → API Gateway → Tile Server → Redis
       → API Gateway → Ephemeris Service
```

Each span captures: service name, operation, duration, status, and relevant attributes (entity ID, tile address, etc.).

### 10.3 Sampling Strategy

| Traffic Type | Sample Rate | Rationale |
|-------------|------------|-----------|
| Normal requests | 5% | Cost control; sufficient for latency analysis |
| Error responses (4xx/5xx) | 100% | Always trace errors for debugging |
| Slow requests (>1s) | 100% | Always trace latency outliers |
| ETL pipeline | 100% | Low volume; full observability needed |

---

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-19 | System | Initial observability and analytics specification |

---

*Document 31 of 33 — Cosmos Explorer Technical Documentation Suite*  
*Cross-references: Doc 25 (Backend Architecture §14), Doc 27 (Frontend State §14), Doc 29 (Security), Doc 32 (Release Procedures)*
