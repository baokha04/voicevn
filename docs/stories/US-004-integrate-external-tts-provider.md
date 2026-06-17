# US-004 Integrate Backend with External TTS Provider

## Status

planned

## Lane

high-risk

## Product Contract

Configure the Cloudflare Worker to securely interface with a third-party Vietnamese TTS API using wrangler secret bindings and forward the audio stream/buffer to the frontend client.

## Relevant Product Docs

- [backend-worker.md](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/product/backend-worker.md)
- [overview.md](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/product/overview.md)

## Acceptance Criteria

- Cloudflare Worker reads `TTS_API_KEY` securely from its environment context.
- Implement upstream POST request to selected TTS API (e.g. Google Cloud TTS, Azure Speech, or a configurable URL) with proper headers and JSON payload.
- Stream/forward the upstream binary response back to the client.
- Handle upstream API failures: if upstream response is not OK, return a clear 502 Bad Gateway response.
- Ensure CORS headers are present on all responses.

## Design Notes

- External system integration (hard gate, high-risk).
- Credentials: `TTS_API_KEY` secret binding.
- Error handling: Upstream failures must be caught and logged cleanly, then formatted as structured JSON error responses.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id US-004 --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | Tests verifying header injection and URL construction |
| Integration | Mocked fetch responses verifying HTTP error translation (400, 502, 500) |
| E2E | Generating real Vietnamese TTS audio via worker proxy with API key set |
| Platform | wrangler dev with local environment secrets |
| Release | wrangler deploy to staging and remote verify |

## Harness Delta

- Added story US-004 to harness database.
- Create decision D0008 regarding chosen provider.

## Evidence

Add commands, reports, screenshots, or links after validation exists.
