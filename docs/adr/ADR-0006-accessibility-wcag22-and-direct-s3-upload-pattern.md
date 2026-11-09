# ADR-0006: WCAG 2.2 Accessibility Compliance and Direct S3 Evidence Upload

## Status
Accepted

## Context
PathPulse serves individuals with various accessibility needs, including visual, motor, and cognitive impairments. The platform must adhere to the W3C Web Content Accessibility Guidelines (WCAG) 2.2 AA standards and the Indian Rights of Persons with Disabilities (RPwD) Act 2016.
Simultaneously, users submit photographic evidence of physical obstacles. Streaming multi-megabyte image binaries through the application server creates significant CPU/memory overhead, exposes the API to denial-of-service vulnerabilities, and complicates media validation.

## Decision
1. **WCAG 2.2 AA Conformance Across Web Application**:
   - Semantic HTML5 landmark structure with dedicated `<header>`, `<main>`, `<nav>`, and `<footer>` elements.
   - Screen reader live regions (`role="status"`, `aria-live="polite"`) for route guidance and dynamic state changes.
   - Visible, high-contrast focus rings (`outline: 3px solid #005a9c`) that are never suppressed (`outline: none` prohibited).
   - Automated axe-core regression scanning integrated into CI pipeline enforcing 0 serious or critical accessibility violations.
   - Redundant semantic cues: statuses and confidence levels are always communicated via text ("Confirmed", "Unverified", "Unavailable"), never by color alone.
2. **Direct-to-S3 Presigned Evidence Upload Pattern**:
   - The API generates 15-minute presigned PUT URLs via `@aws-sdk/s3-request-presigner`.
   - The browser uploads the photograph directly to S3-compatible object storage (MinIO / AWS S3).
   - The API never buffers or streams media bytes. Evidence is accepted only after a server-side `HEAD` object probe verifies that the uploaded file exists, matches allowed MIME types (`image/jpeg`, `image/png`, `image/webp`), and adheres to maximum file size limits (10MB).

## Consequences
### Positive
- Strict accessibility compliance: Verified automated zero-violation barrier for screen readers, keyboard-only users, and high-contrast modes.
- Scalable media ingestion: High-bandwidth image transfers are offloaded directly to distributed object storage, keeping API resource consumption low.
- Storage isolation: Public URLs are never persisted in the database; access is managed via short-lived signed URLs.

### Negative / Trade-offs
- Evidence submission requires two client round-trips: first to obtain the presigned URL, and second to submit the report referencing the confirmed object key.

