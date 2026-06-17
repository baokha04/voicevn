# PROJECT SPECIFICATION

## Vietnamese Text-to-Speech (TTS) Web Application

### 1. Executive Summary

This project aims to build a lightweight, high-performance web application focused exclusively on **Text-to-Speech (TTS)** conversion for the **Vietnamese language**. The solution leverages **Svelte** for a reactive and fast user interface, and **Cloudflare Workers** as a serverless backend proxy to handle audio synthesis orchestration with high efficiency and low latency.

### 2. Technical Stack

- **Frontend:** Svelte (Vite-powered)
- **Backend:** Cloudflare Workers (TypeScript)
- **Storage:** Browser `localStorage` (Temporary caching for offline or repeated playback)
- **TTS Engine Integration:** Third-party Vietnamese-optimized TTS API (e.g., Google Cloud TTS, Azure Speech, or ElevenLabs) routed securely via Cloudflare Workers.

---

### 3. System Architecture & Workflow

The application implements a strict one-way text-to-audio streaming pipeline:

```
[ User Input ] ---> [ Svelte UI (Transcript Display) ]
                           |
                           v (HTTP POST with Payload)
                     [ Cloudflare Worker ]
                           |
                           v (Secure API Call)
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

#### Detailed Workflow:

1. **Text Input:** The user enters the target text into the Svelte reactive text area.
2. **Transcript Generation:** The system locks and displays the final text confirmation (acting as the conversation/speech transcript).
3. **Voice Generation (Vietnamese):** \* The Svelte frontend dispatches an HTTP POST request containing the transcript to the Cloudflare Worker.

- The Worker acts as a secure reverse proxy, injects private API credentials, and invokes a designated upstream Vietnamese TTS model.
- The upstream service synthesizes the voice and streams the audio buffer back to the Worker, which routes it instantly to the client.

4. **Local Storage Caching:**

- The frontend intercepts the incoming binary `Blob`.
- Using the web standard `FileReader` API, the binary data is encoded into a **Data URI (Base64 string)**.
- The string is saved locally using `localStorage.setItem()` to avoid redundant API charges on consecutive replays.

---

### 4. Technical Constraints & Mitigation

- **Storage Limit (localStorage):** Web browsers restrict `localStorage` to approximately **5MB** per domain. Because Base64 encoding inflates file sizes by roughly 33%, this setup is strictly reserved for **short to medium-length text scripts**.
- **Scalability Mitigation:** If the product expands to support long-form text (e.g., audiobooks or long articles), the storage mechanism must be migrated from `localStorage` to browser **IndexedDB**, which provides near-unlimited persistent storage capabilities.

---

### 5. Implementation Source Code Blueprint

#### A. Cloudflare Worker Backend (`src/index.ts`)

```typescript
export interface Env {
  TTS_API_KEY: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // 1. Handle CORS Preflight Requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const { text, lang } = (await request.json()) as {
        text: string;
        lang: string;
      };

      if (!text) {
        return new Response('Missing text payload', { status: 400 });
      }

      // 2. Fetch from Vietnamese-optimized Upstream TTS Engine
      // Example implementation targeting an external provider
      const upstreamResponse = await fetch(
        'https://api.external-tts-provider.com/v1/synthesize',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.TTS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            language_code: lang || 'vi-VN',
            voice_config: { audio_encoding: 'MP3' },
          }),
        },
      );

      if (!upstreamResponse.ok) {
        return new Response('Failed to synthesize speech via upstream API', {
          status: 502,
        });
      }

      const audioBuffer = await upstreamResponse.arrayBuffer();

      // 3. Return Binary Audio Output to Frontend
      return new Response(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
```

#### B. Svelte Frontend Core Component (`src/App.svelte`)

```html
<script lang="ts">
  import { onMount } from 'svelte';

  let text: string = '';
  let transcript: string = '';
  let audioBase64: string = '';
  let isLoading: boolean = false;
  let errorMessage: string = '';

  // Hydrate audio from local storage on component mount
  onMount(() => {
    const cachedAudio = localStorage.getItem('cached_tts_audio');
    const cachedTranscript = localStorage.getItem('cached_tts_transcript');
    if (cachedAudio && cachedTranscript) {
      audioBase64 = cachedAudio;
      transcript = cachedTranscript;
    }
  });

  async function generateVietnameseSpeech() {
    if (!text.trim()) return;

    isLoading = true;
    errorMessage = '';
    transcript = text; // Set final transcript for display

    try {
      const response = await fetch(
        'https://your-worker-subdomain.workers.dev',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcript, lang: 'vi-VN' }),
        },
      );

      if (!response.ok) throw new Error('Server returned an error status.');

      const audioBlob = await response.blob();

      // Convert Binary Blob to Base64 Data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        audioBase64 = base64data;

        try {
          // Cache results locally
          localStorage.setItem('cached_tts_audio', base64data);
          localStorage.setItem('cached_tts_transcript', transcript);
        } catch (storageError) {
          console.warn(
            'Storage quota exceeded. Audio too large for localStorage.',
          );
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (err: any) {
      errorMessage = err.message || 'An unexpected network error occurred.';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  function clearCache() {
    localStorage.removeItem('cached_tts_audio');
    localStorage.removeItem('cached_tts_transcript');
    audioBase64 = '';
    transcript = '';
  }
</script>

<main class="container">
  <h1>Vietnamese Text-to-Speech Engine</h1>

  <div class="input-section">
    <label for="tts-input">Enter Vietnamese Text:</label>
    <textarea
      id="tts-input"
      bind:value="{text}"
      placeholder="Nhập đoạn văn bản tiếng Việt tại đây..."
      rows="5"
    ></textarea>

    <button
      on:click="{generateVietnameseSpeech}"
      disabled="{isLoading"
      ||
      !text.trim()}
    >
      {isLoading ? "Synthesizing Audio..." : "Generate Voice & Save"}
    </button>
  </div>

  {#if errorMessage}
  <div class="error-banner">{errorMessage}</div>
  {/if} {#if transcript}
  <div class="transcript-box">
    <h3>Active Transcript:</h3>
    <p>{transcript}</p>
  </div>
  {/if} {#if audioBase64}
  <div class="audio-player-box">
    <h3>Audio Playback:</h3>
    <audio src="{audioBase64}" controls autoplay></audio>
    <button class="btn-clear" on:click="{clearCache}">
      Clear Cached Audio
    </button>
  </div>
  {/if}
</main>

<style>
  .container {
    max-width: 650px;
    margin: 40px auto;
    padding: 20px;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }
  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-bottom: 12px;
    box-sizing: border-box;
  }
  button {
    background-color: #2563eb;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  button:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
  .transcript-box {
    margin-top: 24px;
    padding: 15px;
    background-color: #f1f5f9;
    border-radius: 4px;
  }
  .audio-player-box {
    margin-top: 20px;
    padding: 15px;
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 4px;
  }
  .btn-clear {
    background-color: #dc2626;
    margin-top: 10px;
    display: block;
  }
  .error-banner {
    color: #b91c1c;
    background-color: #fee2e2;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
  }
</style>
```
