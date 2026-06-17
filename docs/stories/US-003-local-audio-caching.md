# US-003 Implement localStorage Audio Caching

## Status

planned

## Lane

normal

## Product Contract

Implement browser `localStorage` caching of generated TTS audio to prevent redundant API charges and enable instant playback on repeat requests or app restarts.

## Relevant Product Docs

- [frontend-svelte.md](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/product/frontend-svelte.md)
- [overview.md](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/product/overview.md)

## Acceptance Criteria

- Hydrate UI state on component mount: retrieve `cached_tts_audio` and `cached_tts_transcript` from `localStorage`.
- Convert binary audio blob response from the backend into a Base64-encoded Data URL.
- Write the Base64 Data URL and transcript string to `localStorage` upon successful API response.
- Clear cached values when the user clicks "Clear Cached Audio".
- Safe exception handling for `QuotaExceededError` or when browser settings block storage.

## Design Notes

- Storage: Browser `localStorage`.
- Conversion: `FileReader.readAsDataURL` helper.
- Exception handling: `try-catch` blocks around `localStorage.setItem` calls.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id US-003 --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | Unit tests for storage utilities (get, set, clear, size validation) |
| Integration | Svelte component test showing hydration from localStorage mocks |
| E2E | Manual test: generate audio, reload page, verify audio plays immediately without calling API |
| Platform | Browser compatibility check |
| Release | None |

## Harness Delta

- Added story US-003 to harness database.

## Evidence

Add commands, reports, screenshots, or links after validation exists.
