import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    proxy: {
      // Proxy WebSocket + HTTP requests to /agents/ → Cloudflare Worker dev server.
      // The VoiceClient connects to /agents/VoiceVnAgent/{id} for Durable Object routing.
      '/agents': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        ws: true, // <-- critical: enables WebSocket proxying for voice streaming
      },
      // Legacy health-check and any other Worker routes.
      '/health': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});

