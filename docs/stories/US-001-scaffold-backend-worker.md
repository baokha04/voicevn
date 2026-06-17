# US-001 Scaffold Cloudflare Worker Backend

## Status

planned

## Lane

normal

## Product Contract

Initialize a Cloudflare Worker backend project that compiles with TypeScript, handles OPTIONS preflight CORS requests, and responds to POST requests with a mock audio payload or routes to a mock external TTS API.

## Relevant Product Docs

- [backend-worker.md](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/product/backend-worker.md)
- [overview.md](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/product/overview.md)

## Acceptance Criteria

- Initial Worker project scaffolded using TypeScript.
- `wrangler.jsonc` (or `wrangler.toml`) configured with development port and environment variable placeholders.
- A functional HTTP POST handler that:
  - Validates incoming request (requires `text` in JSON payload).
  - Handles CORS preflight OPTIONS requests successfully.
  - Returns a mock audio buffer with `Content-Type: audio/mpeg`.
- Package scripts defined for local development running and linting/type-checking.

## Design Notes

- API: `POST /` and `OPTIONS /`.
- Domain rules: Request body must contain `text` string. If empty, return 400 Bad Request.
- UI surfaces: None.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id US-001 --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | Vitest unit tests for entrypoint handler routing and validation logic |
| Integration | Local development fetch request testing for mock audio return and CORS headers |
| E2E | None for this backend-only story |
| Platform | wrangler dev local execution smoke test |
| Release | None |

## Harness Delta

- Registered intake #1.
- Added story US-001 to harness database.

## Evidence

Add commands, reports, screenshots, or links after validation exists.
