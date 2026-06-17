# Vietnamese TTS Web Application Overview

## Executive Summary
This application provides a fast, lightweight web interface for Vietnamese Text-to-Speech (TTS) synthesis. It enables users to input Vietnamese text, synthesize it into speech via a secure backend proxy, and play back the audio. Audio is cached in the browser's local storage to prevent duplicate calls and optimize API cost.

## Architecture & Data Flow

```
[ User Input ] ---> [ Svelte UI (Transcript Display) ]
                           |
                           v (HTTP POST with Payload)
                     [ Cloudflare Worker ]
                           |
                           v (Secure API Call with Auth headers)
                     [ External TTS Provider (vi-VN) ]
                           |
                           v (Audio Stream/Blob Returned)
                     [ Cloudflare Worker ]
                           |
                           v (Audio Blob)
                     [ Svelte UI ] ---> [ Base64 Conversion ] ---> [ Saved to localStorage ]
                                                                             |
                                                                             v
                                                                   [ HTML5 Audio Playback ]
```

## Technology Stack
- **Frontend**: Svelte, Vite, Vanilla CSS.
- **Backend**: Cloudflare Workers (TypeScript), Wrangler CLI.
- **Storage**: Browser `localStorage` (temporary caching of Base64 strings up to ~5MB limit).
- **TTS Engine**: Vietnamese-optimized third-party API (e.g. Google Cloud, Azure, ElevenLabs).

## Key Constraints
- **Storage Limits**: Browser `localStorage` is restricted to ~5MB. Base64 encoding inflates file size by ~33%. This app is designed for short to medium-length text.
- **Scale Plan**: For long-form text support (articles, documents), the storage layer must migrate to browser `IndexedDB`.
- **Worker Environment**: The worker must run within Cloudflare's serverless environment, respecting memory limits (typically 128MB) and CPU time (typically 50ms on free tier).
