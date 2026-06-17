import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
  SELF,
} from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from './index';

describe('Vietnamese TTS Worker', () => {
  // ── CORS ────────────────────────────────────────────────────────────
  describe('CORS', () => {
    it('responds to OPTIONS with correct CORS headers', async () => {
      const request = new Request('http://localhost/', { method: 'OPTIONS' });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain(
        'POST',
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain(
        'Content-Type',
      );
    });
  });

  // ── Method enforcement ──────────────────────────────────────────────
  describe('Method enforcement', () => {
    it('rejects GET requests with 405', async () => {
      const request = new Request('http://localhost/', { method: 'GET' });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(405);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe('Method Not Allowed');
    });

    it('rejects PUT requests with 405', async () => {
      const request = new Request('http://localhost/', { method: 'PUT' });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(405);
    });
  });

  // ── Input validation ────────────────────────────────────────────────
  describe('Input validation', () => {
    it('returns 400 for invalid JSON body', async () => {
      const request = new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe('Invalid JSON body');
    });

    it('returns 400 when "text" field is missing', async () => {
      const request = new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: 'vi-VN' }),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: string };
      expect(body.error).toContain('text');
    });

    it('returns 400 when "text" is empty string', async () => {
      const request = new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '   ', lang: 'vi-VN' }),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
    });
  });

  // ── Mock provider ──────────────────────────────────────────────────
  describe('Mock TTS provider', () => {
    it('returns audio/mpeg for valid request in mock mode', async () => {
      const request = new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Xin chào thế giới', lang: 'vi-VN' }),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');

      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('defaults lang to vi-VN when not provided', async () => {
      const request = new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Xin chào' }),
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
    });
  });

  // ── Integration via SELF ────────────────────────────────────────────
  describe('Integration (SELF)', () => {
    it('processes a full request through the Worker runtime', async () => {
      const response = await SELF.fetch('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Đây là bài kiểm tra' }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
    });
  });
});
