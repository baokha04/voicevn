# 0008 External TTS Provider Integration

Date: 2026-06-17

## Status

Accepted

## Context

The system must convert Vietnamese text to speech using a third-party API. The specification contains a placeholder URL `https://api.external-tts-provider.com/v1/synthesize` and mentions potential services like Google Cloud TTS, Azure Speech, or ElevenLabs. During local development and validation testing, we need a reliable way to verify the Worker routing, CORS headers, and client integration without calling paid external APIs or hitting rate limits.

## Decision

We decide to:
1. Support a configurable `TTS_PROVIDER` environment variable (values: `mock`, `google`, `azure`, `elevenlabs`).
2. When `TTS_PROVIDER=mock` (default for dev), the Worker returns a deterministic mock MP3 audio file containing silence or synthetic tones, avoiding external API network requests.
3. Configure the worker to proxy request payload to the chosen upstream API and map the response header/body when `TTS_PROVIDER` is set to a real provider.
4. Store API credentials securely using Wrangler Secrets (`TTS_API_KEY`) and map provider endpoints via `TTS_API_URL`.

## Alternatives Considered

1. **Directly Integrate a single provider (e.g. Google Cloud TTS)**: This forces the user to immediately provide API keys and credentials before compiling or running local tests. It slows down development onboarding.
2. **Implement full local text-to-speech synthesis in Worker**: Not feasible due to Worker CPU and size limits.

## Consequences

Positive:

- Developers can run and test the frontend and backend locally with zero external dependencies out of the box.
- The backend remains modular and can adapt to different Vietnamese TTS providers as long as they return standard audio streams.

Tradeoffs:

- Minor routing overhead inside the Worker to branch between the mock provider and the real API integration.

## Follow-Up

- Define the standard payload translation schemas for each provider.
