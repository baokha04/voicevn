<script lang="ts">
  import { onMount } from 'svelte';

  // ── State ────────────────────────────────────────────────────────────
  let text = $state('');
  let transcript = $state('');
  let audioBase64 = $state('');
  let isLoading = $state(false);
  let errorMessage = $state('');

  // ── Derived ──────────────────────────────────────────────────────────
  let canGenerate = $derived(!isLoading && text.trim().length > 0);
  let charCount = $derived(text.length);

  // ── Constants ────────────────────────────────────────────────────────
  const API_URL = '/api';
  const STORAGE_KEY_AUDIO = 'cached_tts_audio';
  const STORAGE_KEY_TRANSCRIPT = 'cached_tts_transcript';

  // ── Lifecycle ────────────────────────────────────────────────────────
  onMount(() => {
    try {
      const cachedAudio = localStorage.getItem(STORAGE_KEY_AUDIO);
      const cachedTranscript = localStorage.getItem(STORAGE_KEY_TRANSCRIPT);
      if (cachedAudio && cachedTranscript) {
        audioBase64 = cachedAudio;
        transcript = cachedTranscript;
      }
    } catch {
      // localStorage may be unavailable (e.g. private browsing)
    }
  });

  // ── Actions ──────────────────────────────────────────────────────────
  async function generateSpeech() {
    if (!canGenerate) return;

    isLoading = true;
    errorMessage = '';
    transcript = text.trim();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript, lang: 'vi-VN' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ?? `Server returned HTTP ${response.status}`,
        );
      }

      const audioBlob = await response.blob();

      // Convert Blob → Base64 Data URL
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read audio blob'));
        reader.readAsDataURL(audioBlob);
      });

      audioBase64 = base64;

      // Cache to localStorage (safe — ignore quota errors)
      try {
        localStorage.setItem(STORAGE_KEY_AUDIO, base64);
        localStorage.setItem(STORAGE_KEY_TRANSCRIPT, transcript);
      } catch {
        console.warn('Storage quota exceeded — audio not cached locally.');
      }
    } catch (err: unknown) {
      errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      console.error('TTS Error:', err);
    } finally {
      isLoading = false;
    }
  }

  function clearCache() {
    try {
      localStorage.removeItem(STORAGE_KEY_AUDIO);
      localStorage.removeItem(STORAGE_KEY_TRANSCRIPT);
    } catch {
      // ignore
    }
    audioBase64 = '';
    transcript = '';
  }

  function handleKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      generateSpeech();
    }
  }
</script>

<main class="app-wrapper">
  <!-- Header -->
  <header class="header">
    <div class="header__badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
      Vietnamese TTS
    </div>
    <h1 class="header__title">VoiceVN</h1>
    <p class="header__subtitle">Convert Vietnamese text to natural speech — instantly.</p>
  </header>

  <!-- Input Card -->
  <div class="card">
    <div class="textarea-wrapper">
      <label for="tts-input">Enter Vietnamese Text</label>
      <textarea
        id="tts-input"
        class="textarea"
        bind:value={text}
        onkeydown={handleKeydown}
        placeholder="Nhập đoạn văn bản tiếng Việt tại đây…"
        rows="5"
        aria-label="Vietnamese text input"
      ></textarea>
      {#if charCount > 0}
        <span class="char-count">{charCount}</span>
      {/if}
    </div>

    <button
      id="btn-generate"
      class="btn btn--primary"
      onclick={generateSpeech}
      disabled={!canGenerate}
      aria-busy={isLoading}
    >
      {#if isLoading}
        <span class="spinner" aria-hidden="true"></span>
        Đang tổng hợp giọng nói…
      {:else}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        Tạo giọng nói
      {/if}
    </button>

    <!-- Error -->
    {#if errorMessage}
      <div class="error-banner" role="alert">
        ⚠️ {errorMessage}
      </div>
    {/if}

    <!-- Transcript -->
    {#if transcript}
      <div class="transcript">
        <div class="transcript__label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Active Transcript
        </div>
        <p class="transcript__text">{transcript}</p>
      </div>
    {/if}

    <!-- Audio Player -->
    {#if audioBase64}
      <div class="audio-player">
        <div class="audio-player__label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="10 8 16 12 10 16 10 8"></polygon>
          </svg>
          Audio Playback
        </div>
        <!-- svelte-ignore a11y_media_has_caption -->
        <audio id="audio-player" src={audioBase64} controls autoplay></audio>
        <div class="audio-player__actions">
          <button
            id="btn-clear-cache"
            class="btn btn--danger"
            onclick={clearCache}
          >
            Clear Cached Audio
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <footer class="footer">
    <p>
      Powered by <a href="https://workers.cloudflare.com" target="_blank" rel="noopener">Cloudflare Workers</a>
      · Built with <a href="https://svelte.dev" target="_blank" rel="noopener">Svelte</a>
    </p>
    <p style="margin-top: 4px;">Ctrl+Enter to generate</p>
  </footer>
</main>
