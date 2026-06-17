/**
 * Vietnamese Text-to-Speech Cloudflare Worker
 *
 * Acts as a secure reverse proxy between the Svelte frontend and a
 * third-party Vietnamese TTS engine. In mock mode it returns a short
 * synthetic audio buffer so local development works without external
 * API credentials.
 */

export interface Env {
  TTS_API_KEY: string;
  TTS_API_URL: string;
  TTS_PROVIDER: string; // "mock" | "google" | "azure" | "elevenlabs"
}

/** Standard CORS headers applied to every response. */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/** Attach CORS headers to an existing Response. */
function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Return a JSON error response with CORS headers. */
function jsonError(message: string, status: number): Response {
  return withCors(
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

/**
 * Generate a tiny valid MP3 frame (silence) for mock mode.
 *
 * This is a minimal MPEG Audio Layer 3 frame header followed by
 * enough zero-padding to form a valid frame. Browsers will decode it
 * as a very short silence — good enough for local development and
 * integration testing.
 */
function generateMockAudio(): Uint8Array {
  // Minimal MP3 frame: MPEG1, Layer 3, 128 kbps, 44100 Hz, stereo
  // Frame header: 0xFF 0xFB 0x90 0x00
  // Frame size = 144 * 128000 / 44100 = 417 bytes (padded)
  const frameSize = 417;
  const frame = new Uint8Array(frameSize);
  frame[0] = 0xff; // sync
  frame[1] = 0xfb; // MPEG1, Layer3, no CRC
  frame[2] = 0x90; // 128 kbps, 44100 Hz
  frame[3] = 0x00; // padding=0, stereo

  // Repeat 10 frames to give ~0.26 seconds of silence
  const frameCount = 10;
  const audio = new Uint8Array(frameSize * frameCount);
  for (let i = 0; i < frameCount; i++) {
    audio.set(frame, i * frameSize);
  }
  return audio;
}

/** Handle the TTS synthesis request. */
async function handleSynthesize(
  request: Request,
  env: Env,
): Promise<Response> {
  // --- Parse & validate request body ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  if (typeof body !== 'object' || body === null) {
    return jsonError('Request body must be a JSON object', 400);
  }

  const { text, lang } = body as { text?: unknown; lang?: unknown };

  if (typeof text !== 'string' || text.trim().length === 0) {
    return jsonError('Missing or empty "text" field', 400);
  }

  const language = typeof lang === 'string' && lang.length > 0 ? lang : 'vi-VN';

  // --- Mock provider (default for local dev) ---
  const provider = (env.TTS_PROVIDER ?? 'mock').toLowerCase();

  if (provider === 'mock') {
    const audio = generateMockAudio();
    return withCors(
      new Response(audio, {
        headers: { 'Content-Type': 'audio/mpeg' },
      }),
    );
  }

  // --- Real upstream provider ---
  if (!env.TTS_API_KEY) {
    return jsonError('TTS_API_KEY secret is not configured', 500);
  }

  const upstreamUrl = env.TTS_API_URL;
  if (!upstreamUrl) {
    return jsonError('TTS_API_URL is not configured', 500);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.TTS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.trim(),
        language_code: language,
        voice_config: { audio_encoding: 'MP3' },
      }),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown upstream error';
    return jsonError(`Upstream TTS request failed: ${message}`, 502);
  }

  if (!upstreamResponse.ok) {
    return jsonError(
      `Upstream TTS API returned HTTP ${upstreamResponse.status}`,
      502,
    );
  }

  const audioBuffer = await upstreamResponse.arrayBuffer();

  return withCors(
    new Response(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    }),
  );
}

// ─── Worker entrypoint ──────────────────────────────────────────────
export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Only POST is allowed
    if (request.method !== 'POST') {
      return jsonError('Method Not Allowed', 405);
    }

    return handleSynthesize(request, env);
  },
} satisfies ExportedHandler<Env>;
