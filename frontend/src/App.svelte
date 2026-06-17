<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { VoiceClient } from '@cloudflare/voice/client';

  // ── Types ──────────────────────────────────────────────────────────────
  type VoiceStatus = 'idle' | 'listening' | 'thinking' | 'speaking';
  interface TranscriptMsg { role: string; text: string; }

  // ── State ──────────────────────────────────────────────────────────────
  let status = $state<VoiceStatus>('idle');
  let connected = $state(false);
  let messages = $state<TranscriptMsg[]>([]);
  let interimTranscript = $state('');
  let isMuted = $state(false);
  let audioLevel = $state(0);   // 0–1 mic RMS
  let errorMessage = $state('');
  let textInput = $state('');

  let client: VoiceClient | null = null;
  let messagesEndEl = $state<HTMLDivElement>();

  // ── Derived ────────────────────────────────────────────────────────────
  let inCall = $derived(status !== 'idle');
  let canSendText = $derived(inCall && textInput.trim().length > 0);

  // Translate VoiceStatus → Vietnamese label
  const STATUS_LABELS: Record<VoiceStatus, string> = {
    idle: 'Nhấn để bắt đầu hội thoại',
    listening: 'Đang lắng nghe…',
    thinking: 'Đang suy nghĩ…',
    speaking: 'Đang nói…',
  };

  // ── Lifecycle ──────────────────────────────────────────────────────────
  onMount(() => {
    try {
      /**
       * Host resolution:
       *  - In local dev (Vite on :5173) → vite.config.ts proxy sends /agents/* to :8787
       *    so we can use the same origin as the page.
       *  - In production (Pages + Worker on the same zone) → same-origin also works.
       * We never hard-code :8787 here so the same build works in all environments.
       */
      client = new VoiceClient({ agent: 'VoiceVnAgent' });

      client.addEventListener('statuschange', (s: any) => { status = s as VoiceStatus; });
      client.addEventListener('connectionchange', (c: any) => { connected = c as boolean; });
      client.addEventListener('transcriptchange', (msgs: any) => {
        messages = (msgs as TranscriptMsg[]) ?? [];
        // Auto-scroll to the latest message.
        setTimeout(() => messagesEndEl?.scrollIntoView({ behavior: 'smooth' }), 50);
      });
      client.addEventListener('interimtranscript', (t: any) => { interimTranscript = (t as string) ?? ''; });
      client.addEventListener('mutechange', (m: any) => { isMuted = m as boolean; });
      client.addEventListener('audiolevelchange', (l: any) => { audioLevel = l as number; });
      client.addEventListener('error', (e: any) => {
        errorMessage = (e as Error)?.message ?? String(e);
        console.error('[VoiceClient] Error:', e);
      });

      client.connect();
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Initialization failed';
    }
  });

  onDestroy(() => {
    client?.endCall();
    client?.disconnect();
  });

  // ── Actions ────────────────────────────────────────────────────────────
  async function handleCallToggle() {
    errorMessage = '';
    if (!client) return;
    try {
      if (status === 'idle') {
        await client.startCall();
      } else {
        client.endCall();
        interimTranscript = '';
      }
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Failed to toggle voice call';
    }
  }

  function handleMuteToggle() {
    client?.toggleMute();
  }

  function sendTextMessage() {
    if (!client || !textInput.trim()) return;
    try {
      client.sendText(textInput.trim());
      textInput = '';
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : 'Failed to send message';
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  }

  function dismissError() { errorMessage = ''; }
</script>

<main class="app-wrapper">
  <!-- ── Header ─────────────────────────────────────────────── -->
  <header class="header">
    <div class="header__badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8"  y1="23" x2="16" y2="23"/>
      </svg>
      VoiceVN Agent · Real-time
    </div>
    <h1 class="header__title">VoiceVN</h1>
    <p class="header__subtitle">Hội thoại trực tiếp thời gian thực bằng tiếng Việt</p>

    <!-- WebSocket connection indicator -->
    <div class="connection-badge connection-badge--{connected ? 'live' : 'offline'}"
         aria-live="polite">
      <span class="connection-dot"></span>
      {connected ? 'Đã kết nối' : 'Đang kết nối…'}
    </div>
  </header>

  <!-- ── Main Card ───────────────────────────────────────────── -->
  <div class="card">

    <!-- Call Control -->
    <section class="call-control-section" aria-label="Voice call controls">
      <!-- Animated visualizer button -->
      <button
        id="btn-call-toggle"
        class="call-btn call-btn--{status}"
        onclick={handleCallToggle}
        aria-label={inCall ? 'Kết thúc cuộc gọi' : 'Bắt đầu cuộc gọi'}
        aria-pressed={inCall}
      >
        <div class="pulse-ring"  aria-hidden="true"></div>
        <div class="pulse-ring-2" aria-hidden="true"></div>
        <div class="call-icon-container" aria-hidden="true">
          {#if status === 'idle'}
            <!-- Phone icon -->
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          {:else}
            <!-- Stop icon -->
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
            </svg>
          {/if}
        </div>
      </button>

      <!-- Status text -->
      <div class="status-label" role="status" aria-live="polite">
        <span class="dot dot--{status}" class:dot--active={inCall} aria-hidden="true"></span>
        {STATUS_LABELS[status]}
      </div>

      <!-- Audio level bar (visible only when listening) -->
      {#if status === 'listening'}
        <div class="audio-level-bar" role="meter" aria-label="Mic level"
             aria-valuenow={Math.round(audioLevel * 100)} aria-valuemin="0" aria-valuemax="100">
          <div class="audio-level-fill" style="width: {audioLevel * 100}%"></div>
        </div>
      {/if}

      <!-- Mute toggle (visible only during a call) -->
      {#if inCall}
        <button id="btn-mute" class="btn btn--secondary btn-mute"
                onclick={handleMuteToggle}
                aria-pressed={isMuted}
                aria-label={isMuted ? 'Bật mic' : 'Tắt mic'}>
          {#if isMuted}
            <!-- Mic-off icon -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8"  y1="23" x2="16" y2="23"/>
            </svg>
            Bật Mic
          {:else}
            <!-- Mic-on icon -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8"  y1="23" x2="16" y2="23"/>
            </svg>
            Tắt Mic
          {/if}
        </button>
      {/if}
    </section>

    <!-- Error Banner -->
    {#if errorMessage}
      <div class="error-banner" role="alert">
        ⚠️ {errorMessage}
        <button class="error-dismiss" onclick={dismissError} aria-label="Đóng thông báo lỗi">✕</button>
      </div>
    {/if}

    <!-- Live / interim transcript -->
    {#if interimTranscript}
      <div class="interim-transcript" aria-live="polite" aria-label="Đang nhận dạng giọng nói">
        <span class="pulsing-mic-indicator" aria-hidden="true">🎙️</span>
        <p class="interim-transcript__text"><em>{interimTranscript}</em></p>
      </div>
    {/if}

    <!-- Conversation history -->
    {#if messages.length > 0}
      <section class="chat-container" aria-label="Lịch sử hội thoại">
        <div class="chat-header">Lịch sử hội thoại</div>
        <div class="messages-list">
          {#each messages as msg, i (i)}
            <div class="message-bubble message-bubble--{msg.role}">
              <div class="message-bubble__author">{msg.role === 'user' ? 'Bạn' : 'VoiceVN'}</div>
              <div class="message-bubble__text">{msg.text}</div>
            </div>
          {/each}
          <!-- Invisible scroll anchor -->
          <div bind:this={messagesEndEl}></div>
        </div>
      </section>
    {/if}

    <!-- Text input fallback (works even during a call) -->
    <div class="text-chat-bar">
      <label for="text-chat-input" class="sr-only">Gửi tin nhắn văn bản</label>
      <input
        id="text-chat-input"
        type="text"
        class="chat-input"
        bind:value={textInput}
        onkeydown={handleKeydown}
        placeholder={inCall ? 'Gửi tin nhắn văn bản…' : 'Bắt đầu cuộc gọi để nhắn tin'}
        disabled={!inCall}
        autocomplete="off"
        spellcheck
      />
      <button
        id="btn-send-text"
        class="btn btn--primary btn--send"
        onclick={sendTextMessage}
        disabled={!canSendText}
        aria-label="Gửi"
      >
        Gửi
      </button>
    </div>
  </div>

  <!-- ── Footer ─────────────────────────────────────────────── -->
  <footer class="footer">
    <p>
      Powered by <a href="https://developers.cloudflare.com/agents/" target="_blank" rel="noopener">Cloudflare Agents</a>
      · Built with <a href="https://svelte.dev" target="_blank" rel="noopener">Svelte 5</a>
    </p>
  </footer>
</main>
