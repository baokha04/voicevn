import { env, createExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker, { VoiceVnAgent } from './index';

describe('VoiceVnAgent WebSocket Backend', () => {
  it('instantiates the VoiceVnAgent class successfully', () => {
    expect(VoiceVnAgent).toBeDefined();
  });

  it('returns 404 for unknown non-agent routes', async () => {
    const request = new Request('http://localhost/unknown-route', { method: 'GET' });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env as any, ctx);

    expect(response.status).toBe(404);
  });
});
