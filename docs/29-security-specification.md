# Cosmos Explorer — Security Specification

**Document:** 29 — Security Specification  
**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Published  
**Product:** Cosmos Explorer — Interactive 3D Universe Visualization  
**Depends On:** Doc 25 (Backend Architecture §15), Doc 26 (API Contract §3)  
**Consumed By:** Doc 28 (Developer Setup), Doc 30 (Test Cases — TS-SEC), Doc 32 (Release Procedures)

---

## Table of Contents

1. [Security Posture Overview](#1-security-posture-overview)
2. [Threat Model](#2-threat-model)
3. [Transport Security](#3-transport-security)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [API Security](#5-api-security)
6. [Frontend Security](#6-frontend-security)
7. [Data Security](#7-data-security)
8. [Infrastructure Security](#8-infrastructure-security)
9. [Supply Chain Security](#9-supply-chain-security)
10. [Incident Response](#10-incident-response)
11. [Compliance & Privacy](#11-compliance--privacy)
12. [Security Testing Requirements](#12-security-testing-requirements)

---

## 1. Security Posture Overview

### 1.1 Classification

Cosmos Explorer is a **public-facing scientific visualization tool** serving primarily open astronomical data. The security posture reflects this profile:

| Aspect | Classification | Rationale |
|--------|---------------|-----------|
| Data sensitivity | Low–Medium | Astronomical data is public; user session data is low-sensitivity |
| User accounts | Optional | Anonymous browsing is the primary use case; accounts for bookmarks/exports |
| Financial transactions | None | No payments, subscriptions, or purchases |
| PII collected | Minimal | Email (optional for Research tier), session tokens |
| Regulatory scope | GDPR, CCPA | EU and California privacy laws apply to any user analytics |

### 1.2 Security Principles

- **Defense in depth**: Multiple layers (TLS, CORS, rate limiting, input validation, WAF)
- **Least privilege**: Services access only the data they need; no service has full database admin
- **Fail secure**: On error, deny access rather than granting it; degrade gracefully
- **Open data, protected infrastructure**: Astronomical data is freely accessible; infrastructure, credentials, and user session data are protected
- **Secure by default**: All defaults are restrictive; features require explicit opt-in

---

## 2. Threat Model

### 2.1 Assets

| Asset | Value | Location |
|-------|-------|----------|
| Astronomical database | High (data integrity) | PostgreSQL, Elasticsearch |
| User session data | Low (bookmarks, observations) | PostgreSQL |
| API keys | Medium | Redis (hashed), client storage |
| SPICE kernels | Low (public NASA data) | Object storage |
| Infrastructure credentials | Critical | Secrets manager |
| Source code | High | Git repository |

### 2.2 Threat Actors

| Actor | Motivation | Capability | Likelihood |
|-------|-----------|------------|------------|
| Script kiddies | Vandalism, DDoS | Automated tools | High |
| Data scrapers | Bulk data extraction | Scripted API access | Medium |
| Competitors | Intelligence | Moderate technical | Low |
| Nation-state | Unlikely target | Advanced | Very Low |

### 2.3 Attack Surface

| Surface | Vectors | Mitigations |
|---------|---------|-------------|
| Public API | Injection, abuse, DDoS | Input validation, rate limiting, WAF |
| WebSocket | Connection flooding, message injection | Auth on connect, message validation, connection limits |
| Static assets (CDN) | Cache poisoning, asset manipulation | SRI hashes, immutable cache headers |
| Frontend | XSS, CSRF, clickjacking | CSP, SameSite cookies, frame-ancestors |
| Backend services | SSRF, RCE, dependency vulnerabilities | Network isolation, minimal attack surface, automated scanning |
| CI/CD | Supply chain, credential leakage | Signed commits, secret scanning, pinned dependencies |

---

## 3. Transport Security

### 3.1 TLS Configuration

All traffic encrypted with TLS 1.3 minimum:

| Parameter | Value |
|-----------|-------|
| Minimum TLS version | 1.3 |
| Cipher suites | TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256, TLS_AES_128_GCM_SHA256 |
| Certificate | Let's Encrypt (auto-renewed) or AWS ACM |
| HSTS | `max-age=31536000; includeSubDomains; preload` |
| Certificate Transparency | Required; monitored via ct-monitor |
| OCSP Stapling | Enabled |

### 3.2 HTTP → HTTPS Redirect

All HTTP requests receive `301 Moved Permanently` to HTTPS equivalent. No mixed content permitted.

### 3.3 Cross-Origin Isolation

For SharedArrayBuffer support (required for zero-copy tile transfer — Doc 27 §12.3):

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These headers restrict cross-origin resource loading but are required for performance-critical features.

---

## 4. Authentication & Authorization

### 4.1 Authentication Tiers

Per Doc 26 §3.1:

| Tier | Method | Token Format | Storage |
|------|--------|-------------|---------|
| Anonymous | None | Session token (client-generated UUID) | localStorage |
| Registered | API key | `ce_reg_{base62_32}` | localStorage; hashed in Redis |
| Research | API key + institution | `ce_res_{base62_32}` + ROR ID | localStorage; hashed in Redis |
| Internal | mTLS | X.509 client certificate | Certificate store |

### 4.2 API Key Security

- Keys generated server-side with `crypto.randomBytes(32)` encoded base62
- Stored as SHA-256 hash in Redis — raw key never persisted server-side
- Keys transmitted only over TLS; never logged in plaintext
- Key rotation: users can regenerate at any time; old key immediately invalidated
- Research keys require email verification to a `.edu` or ROR-listed institution domain

### 4.3 Session Tokens

Session tokens for anonymous users:
- Generated client-side as `sess_{UUIDv4}`
- Used only for keying bookmarks/observations — not for authentication
- No server-side session state; tokens are opaque identifiers
- Expire after 90 days of inactivity (server garbage collection)

### 4.4 Authorization Matrix

| Endpoint Group | Anonymous | Registered | Research | Internal |
|---------------|-----------|------------|----------|----------|
| Entities (read) | ✓ | ✓ | ✓ | ✓ |
| Search (basic) | ✓ | ✓ | ✓ | ✓ |
| Search (advanced) | ✗ | ✗ | ✓ | ✓ |
| Tiles | ✓ | ✓ | ✓ | ✓ |
| Ephemeris (single) | ✓ | ✓ | ✓ | ✓ |
| Ephemeris (batch >100) | ✗ | ✗ | ✓ | ✓ |
| FITS upload | ✗ | ✗ | ✓ | ✓ |
| Bookmarks/observations | ✓ (session) | ✓ | ✓ | ✓ |
| Export | ✗ | ✓ | ✓ | ✓ |
| System endpoints | ✓ | ✓ | ✓ | ✓ |
| Admin endpoints | ✗ | ✗ | ✗ | ✓ |

---

## 5. API Security

### 5.1 Input Validation

All API inputs validated at the gateway before reaching application logic:

| Input Type | Validation |
|------------|-----------|
| Path parameters (IDs) | Integer range check or regex for ENT-IDs (`/^ENT-\d{4}$/`) |
| Query parameters | Type coercion, range bounds, max length (1000 chars) |
| Request body (JSON) | JSON Schema validation against OpenAPI spec |
| File uploads (FITS) | Magic byte check (FITS: `SIMPLE  =`), max 500 MB, virus scan |
| Headers | Strict allowlist; reject unknown custom headers |

### 5.2 Rate Limiting

Per Doc 26 §3 — implemented at API gateway (nginx + lua-resty-limit or AWS API Gateway):

| Tier | Requests/min | Burst/s | Tile bandwidth/hr |
|------|-------------|---------|-------------------|
| Anonymous | 60 | 10 | 500 MB |
| Registered | 300 | 30 | 2 GB |
| Research | 1,000 | 100 | 10 GB |
| Internal | Unlimited | — | Unlimited |

Rate limit state stored in Redis. Sliding window algorithm with per-IP and per-API-key tracking.

### 5.3 Request Size Limits

| Limit | Value |
|-------|-------|
| Max request body (JSON) | 1 MB |
| Max request body (file upload) | 500 MB |
| Max URL length | 8,192 bytes |
| Max header size | 16 KB |
| Max WebSocket message | 64 KB |

### 5.4 SQL Injection Prevention

- All database queries use parameterized queries (prepared statements)
- No string interpolation in SQL
- ORM (Prisma / TypeORM) with query builder — raw SQL prohibited except in ETL with explicit review
- PostgreSQL roles: API service role has `SELECT` only on public tables; `INSERT/UPDATE` only on bookmarks/observations

### 5.5 CORS Policy

```
Access-Control-Allow-Origin: https://cosmosexplorer.app
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Request-ID, Accept-Encoding, If-None-Match
Access-Control-Max-Age: 86400
Access-Control-Expose-Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-Data-Version, ETag
```

No wildcard `*` allowed. Additional origins for staging and development added per-environment.

### 5.6 WebSocket Security

- Connection requires valid session token
- Message rate limit: 10 messages/second per connection
- Message size limit: 64 KB
- Invalid messages silently dropped (no error response to prevent probing)
- Max 3 concurrent WebSocket connections per session
- Connection timeout: 60 seconds without heartbeat

---

## 6. Frontend Security

### 6.1 Content Security Policy

```
Content-Security-Policy:
  default-src 'none';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' https://api.cosmosexplorer.app wss://api.cosmosexplorer.app;
  worker-src 'self' blob:;
  child-src 'none';
  frame-ancestors 'none';
  form-action 'none';
  base-uri 'self';
  upgrade-insecure-requests;
```

Notes:
- `'unsafe-inline'` for style-src required by some CSS-in-JS; goal is to remove via nonce-based approach
- `blob:` for img-src required for canvas-to-blob export
- `blob:` for worker-src required for inline Web Workers
- No `eval`, no `unsafe-eval` — CSP blocks dynamic code execution

### 6.2 Subresource Integrity (SRI)

All CDN-loaded third-party scripts include SRI hashes:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r184/three.min.js"
        integrity="sha384-{hash}"
        crossorigin="anonymous"></script>
```

Note: In the Vite build pipeline, Three.js is bundled from npm — SRI applies only to any external CDN resources.

### 6.3 XSS Prevention

- React auto-escapes all rendered content by default
- No use of `dangerouslySetInnerHTML` except for sanitized Markdown in education content (DOMPurify)
- Search query displayed in UI is always escaped
- Entity names from API rendered as text nodes, never as HTML
- Bookmark labels sanitized on both client and server

### 6.4 Clickjacking Protection

```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```

### 6.5 Client-Side Storage Security

- **localStorage:** Session token and settings only — no API keys in localStorage for anonymous tier
- **IndexedDB:** Tile cache and entity data — not sensitive
- **No sensitive data in URL:** API keys sent via `Authorization` header, never as query parameters
- **No cookies:** The application is stateless from the server's perspective; no session cookies

---

## 7. Data Security

### 7.1 Data Classification

| Data Type | Classification | Encryption at Rest | Encryption in Transit | Access Control |
|-----------|---------------|-------------------|---------------------|---------------|
| Astronomical catalog data | Public | Optional (EBS encryption) | TLS 1.3 | Read-only for all |
| Binary tile data | Public | Optional | TLS 1.3 + Brotli | Read-only for all |
| User bookmarks/observations | Low | AES-256 (EBS) | TLS 1.3 | Session-scoped |
| API keys (hashed) | Medium | AES-256 (EBS) | TLS 1.3 | Internal only |
| SPICE kernels | Public | Optional | TLS 1.3 | Read-only |
| Infrastructure secrets | Critical | AWS Secrets Manager | TLS 1.3 | IAM roles only |
| Application logs | Internal | AES-256 (CloudWatch) | TLS 1.3 | DevOps team only |

### 7.2 Database Security

- PostgreSQL listens only on VPC internal network — no public endpoint
- Connections require TLS (sslmode=verify-full)
- Separate database roles per service:
  - `cosmos_api`: SELECT on all tables; INSERT/UPDATE/DELETE on bookmarks, observations
  - `cosmos_etl`: Full access to staging tables; no access to user data
  - `cosmos_admin`: Full access (used only for migrations, never by running services)
- Automated daily backups with 30-day retention
- Point-in-time recovery enabled (WAL archiving)

### 7.3 Secrets Management

- All secrets stored in AWS Secrets Manager (or HashiCorp Vault)
- Secrets injected as environment variables at container startup — never baked into images
- Secret rotation schedule:
  - Database passwords: 90 days
  - API signing keys: 180 days
  - TLS certificates: Auto-renewed (Let's Encrypt 90-day)
- No secrets in Git — enforced by `git-secrets` pre-commit hook and CI check

---

## 8. Infrastructure Security

### 8.1 Network Architecture

```
Internet → CloudFront (CDN + WAF) → ALB (API Gateway) → EKS VPC
                                                          │
                                    ┌─────────────────────┼──────────────────────┐
                                    │ Private Subnet       │                      │
                                    │                      │                      │
                                    │  ┌────────────┐  ┌───┴────────┐  ┌────────┐│
                                    │  │ API Service │  │ Tile Server│  │Ephemeris││
                                    │  └──────┬─────┘  └────────────┘  └────────┘│
                                    │         │                                   │
                                    │  ┌──────┴─────┐  ┌────────────┐  ┌────────┐│
                                    │  │ PostgreSQL  │  │Elasticsearch│  │ Redis  ││
                                    │  │ (RDS)       │  │(Managed)    │  │(Elasti-││
                                    │  └─────────────┘  └────────────┘  │ Cache) ││
                                    │                                   └────────┘│
                                    └─────────────────────────────────────────────┘
```

### 8.2 Network Controls

- All backend services in private VPC subnets — no public IPs
- Only ALB/CloudFront has public endpoint
- Security groups restrict inter-service communication to required ports only
- NAT Gateway for outbound internet access (ETL data downloads)
- VPC Flow Logs enabled for forensic analysis

### 8.3 Container Security

- Base images: Distroless (Node.js), Chainguard (Rust), python:3.11-slim
- No root user in containers — all run as non-root UID
- Read-only root filesystem (writable volumes only where needed)
- Resource limits enforced via Kubernetes (CPU, memory, ephemeral storage)
- Container image scanning: Trivy in CI pipeline; block deployment of images with Critical/High CVEs

### 8.4 DDoS Protection

- CloudFront with AWS Shield Standard (volumetric DDoS)
- WAF rules: rate limiting, geo-blocking (if needed), SQL injection patterns, XSS patterns
- Application-level rate limiting (§5.2) as second layer
- WebSocket connection limits prevent Slowloris-style attacks

---

## 9. Supply Chain Security

### 9.1 Dependency Management

- **npm:** `pnpm` with lockfile integrity verification
- **Python:** `pip-compile` with hashed requirements
- **Rust:** `cargo audit` for vulnerability scanning; `Cargo.lock` committed
- **Dependabot:** Enabled for all languages; auto-creates PRs for security updates
- **npm audit:** Runs in CI; builds fail on Critical/High severity

### 9.2 Build Pipeline Security

- CI runners are ephemeral (destroyed after each job)
- Build artifacts signed and stored in private registry
- Docker images tagged with Git SHA — no mutable `latest` tag in production
- Signed commits required for production branch merges

### 9.3 Third-Party Library Policy

| Risk Level | Policy |
|------------|--------|
| Critical path (Three.js, React, Zustand) | Pin exact version; manual upgrade review |
| Utility (lodash, date-fns) | Pin minor version; auto-update patch |
| Dev-only (ESLint, Prettier) | Auto-update minor; review major |
| Transitive | Monitored via Dependabot; audit on CI |

---

## 10. Incident Response

### 10.1 Severity Levels

| Severity | Definition | Response Time | Examples |
|----------|-----------|--------------|---------|
| SEV-1 | Data breach, service compromise | <1 hour | Unauthorized DB access, API key leak |
| SEV-2 | Service degradation, vulnerability | <4 hours | DDoS, critical CVE in dependency |
| SEV-3 | Security policy violation | <24 hours | CSP bypass, rate limit misconfiguration |
| SEV-4 | Security improvement needed | Next sprint | Dependency update, config hardening |

### 10.2 Response Procedure

1. **Detect**: Automated alerts (CloudWatch, WAF, rate limit triggers) or manual report
2. **Triage**: Assign severity; notify security lead and on-call engineer
3. **Contain**: Isolate affected service; rotate compromised credentials; block attacker IP
4. **Eradicate**: Patch vulnerability; deploy fix; verify fix
5. **Recover**: Restore service; verify data integrity; clear caches
6. **Post-mortem**: Document timeline, root cause, remediation, prevention measures

### 10.3 Contact Points

| Role | Notification Channel |
|------|---------------------|
| Security Lead | PagerDuty (SEV-1/2) |
| On-call Engineer | PagerDuty (SEV-1/2), Slack (SEV-3/4) |
| Engineering Manager | Email (all SEVs) |

---

## 11. Compliance & Privacy

### 11.1 Data Collection

Cosmos Explorer collects minimal personal data:

| Data | Purpose | Retention | Legal Basis |
|------|---------|-----------|-------------|
| Session token | Bookmark/observation keying | 90 days inactive | Legitimate interest |
| API key + email (Registered) | Authentication, rate limiting | Until account deletion | Contract |
| Institution email (Research) | Tier verification | Until account deletion | Contract |
| IP address (logs) | Rate limiting, security | 30 days | Legitimate interest |
| Usage analytics (optional) | Product improvement | 12 months, anonymized | Consent |

### 11.2 GDPR Compliance

- **Right to access**: Users can request all data associated with their session/account
- **Right to erasure**: DELETE /bookmarks, DELETE /observations; account deletion endpoint
- **Data portability**: Export bookmarks/observations as JSON
- **Privacy by design**: Anonymous-first architecture; no tracking without consent
- **Cookie notice**: Not required (no cookies used); analytics consent banner for optional telemetry

### 11.3 CCPA Compliance

- "Do Not Sell My Personal Information" link on privacy page (even though we don't sell data)
- Right to deletion honored within 30 days
- Annual privacy impact assessment

---

## 12. Security Testing Requirements

### 12.1 Automated Testing (CI)

| Test | Tool | Frequency | Blocking |
|------|------|-----------|----------|
| Dependency vulnerability scan | `npm audit`, `cargo audit`, `pip audit` | Every PR | Critical/High |
| Container image scan | Trivy | Every build | Critical/High |
| SAST (static analysis) | ESLint security rules, Semgrep | Every PR | Critical |
| Secret scanning | git-secrets, GitHub Secret Scanning | Every push | Always |
| CSP validation | Custom test against deployed headers | Every deploy | Always |

### 12.2 Periodic Testing

| Test | Frequency | Owner |
|------|-----------|-------|
| Penetration testing (3rd party) | Annual | Security Lead |
| OWASP Top 10 review | Semi-annual | Engineering |
| Dependency audit (full tree) | Quarterly | DevOps |
| Incident response drill | Annual | Engineering + Security |
| Access control review | Quarterly | Engineering Manager |

### 12.3 Test Cases

See Doc 30 §17 (TS-SEC suite) for specific security test cases covering HTTPS, authentication, injection, XSS, CORS, and rate limiting.

---

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-19 | System | Initial security specification |

---

*Document 29 of 33 — Cosmos Explorer Technical Documentation Suite*  
*Cross-references: Doc 25 (Backend Architecture §15), Doc 26 (API Contract §3), Doc 30 (Test Cases — TS-SEC)*
