# Test Matrix

This file maps product behavior to proof.

No product behavior has been defined or implemented yet. Do not mark a row
implemented until tests or validation evidence exist.

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

## Matrix

| US-001 | [US-001](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/stories/US-001-scaffold-backend-worker.md) | no | no | no | no | planned | none |
| US-002 | [US-002](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/stories/US-002-scaffold-svelte-frontend.md) | no | no | no | no | planned | none |
| US-003 | [US-003](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/stories/US-003-local-audio-caching.md) | no | no | no | no | planned | none |
| US-004 | [US-004](file:///c:/Users/baokh/Projects/antigravity/projects/cloudflare/voicevn/docs/stories/US-004-integrate-external-tts-provider.md) | no | no | no | no | planned | none |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers only shell, deployment, mobile, desktop, or runtime
  behavior that cannot be proven in lower layers.
- A story can be implemented without every proof column if the story packet
  explains why.
