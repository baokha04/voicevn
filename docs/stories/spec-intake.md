# Spec Intake

Date: 2026-06-17

## Source

Where did the spec come from?

- User prompt: `/cloudflare init cloudflare worker with spec @[spec_tts.md]`
- Attached file: [spec_tts.md](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/spec_tts.md)
- External reference: None

## Project Summary

A lightweight, high-performance web application focused exclusively on Vietnamese Text-to-Speech (TTS) conversion. The backend uses a Cloudflare Worker as a secure proxy to a third-party TTS engine. The frontend is built with Svelte (Vite) and caches synthesized audio in the browser's `localStorage` as Base64-encoded Data URIs to prevent redundant API calls.

## Candidate Product Docs

List the product contract files that should be created under `docs/product/`.

| File | Purpose | Source sections |
| --- | --- | --- |
| `docs/product/overview.md` | Core architecture, technical stack, user workflow, and storage constraints | Sections 1, 2, 3, 4 |
| `docs/product/backend-worker.md` | API contracts, Worker specification, environment variables, CORS, and upstream proxy details | Section 5.A |
| `docs/product/frontend-svelte.md` | Svelte application structure, UI components, state management, and caching behavior | Section 5.B |

## Candidate Epics

List only the epics that are clear enough to name. Do not create every story packet yet.

| Epic | Description | Status |
| --- | --- | --- |
| E01 | Backend Worker Scaffolding and Mock Implementation | unsliced |
| E02 | Svelte Frontend and Client-Side Audio Caching | unsliced |
| E03 | E2E Integration and Upstream TTS Provider Configuration | unsliced |

## Architecture Questions

- Runtime stack: Svelte (Vite) + Cloudflare Workers (TypeScript)
- Product surfaces: Web browser, Cloudflare Workers HTTP API
- Storage: Browser `localStorage` (Base64 encoding)
- External providers: Vietnamese-optimized Upstream TTS Engine (e.g., Google Cloud TTS, Azure Speech, or ElevenLabs)
- Deployment target: Cloudflare Workers & Cloudflare Pages (or static files)
- Security model: Environment bindings (`TTS_API_KEY`), CORS headers

## Validation Shape

What proof will this project eventually need?

| Layer | Expected proof |
| --- | --- |
| Unit | Worker route handlers, text validation, storage utility functions |
| Integration | Upstream TTS API mock tests, CORS preflight tests |
| E2E | User entering text, clicking generate, playing back cached audio |
| Platform | wrangler local dev server smoke test |
| Release | wrangler deploy check |

## Open Decisions

- **TTS Engine Choice**: Which third-party service to use for Vietnamese TTS? The spec mentions a placeholder `https://api.external-tts-provider.com/v1/synthesize`. For initial implementation, we should use a mock upstream endpoint or support a configurable environment variable to easily switch providers.
- **Project Structure**: Where should backend (`worker/` or root) and frontend (`frontend/` or root) code reside? We should create a clean structure (e.g., `packages/worker` and `packages/frontend`, or similar monorepo/multi-folder setup).

## First Story Candidates

- **US-001**: Initialize Cloudflare Worker backend project structure with Wrangler configuration, TypeScript, and mock endpoint.
- **US-002**: Initialize Svelte frontend project with Vite, basic UI layout, and fetch integration.
- **US-003**: Implement localStorage audio caching in Svelte frontend.
- **US-004**: Integrate backend Worker with actual external TTS provider and secret management.

## Harness Delta

- Initialize `harness.db` (done).
- Register intake (done).
- Create this `spec-intake.md`.
- Create product docs: `overview.md`, `backend-worker.md`, `frontend-svelte.md`.
- Add candidate stories to the matrix.
