# US-002 Scaffold Svelte Frontend

## Status

planned

## Lane

normal

## Product Contract

Scaffold the Svelte frontend application with Vite, define the layout structure with a textarea, controls, active transcript display, and an audio player.

## Relevant Product Docs

- [frontend-svelte.md](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/product/frontend-svelte.md)
- [overview.md](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/product/overview.md)

## Acceptance Criteria

- Initial Svelte project scaffolded using Vite and TypeScript.
- Beautiful, premium user interface styled with Vanilla CSS (harmonies, dark mode, rich interactive elements).
- Layout contains:
  - Textarea with placeholder.
  - "Generate Voice & Save" button (disabled when input is blank or when request is loading).
  - Clear Cached Audio button.
  - Active transcript block showing current audio transcript.
  - HTML5 audio player for playback.
- Mock API integration to send text and receive the mock audio from the Worker backend.

## Design Notes

- UI surfaces: Browser app.
- State management: binds textarea `text`, active `transcript`, `isLoading`, and `audioBase64` source.
- CSS styling: Curated premium colors, modern typography, glassmorphism, responsive box alignment.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id US-002 --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | Vitest / Testing Library checks for Svelte components |
| Integration | Mock fetch/API client tests for request invocation |
| E2E | Manual local browser check of the UI rendering and button states |
| Platform | npm run dev local server execution smoke test |
| Release | None |

## Harness Delta

- Added story US-002 to harness database.

## Evidence

Add commands, reports, screenshots, or links after validation exists.
