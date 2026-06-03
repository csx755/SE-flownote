import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { errorHandler, nonErrorCatcher } from '../../middleware/error';
import { z } from 'zod';

// ============================================================
// errorHandler — Hono onError handler
// ============================================================

function createTestApp() {
  const app = new Hono();
  // nonErrorCatcher: 捕获非 Error 的 throw（Hono 会重新抛出它们）
  app.use('*', nonErrorCatcher);
  // errorHandler: 通过 onError 注册，处理所有 Error 实例
  app.onError(errorHandler);
  return app;
}

describe('errorHandler', () => {
  // ── pass-through ────────────────────────────────────────

  it('passes through successful responses unchanged', async () => {
    const app = createTestApp();
    app.get('/ok', (c) => c.json({ data: 'hello' }));

    const res = await app.request('/ok');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: 'hello' });
  });

  it('passes through different status codes', async () => {
    const app = createTestApp();
    app.get('/created', (c) => c.json({ id: 1 }, 201));

    const res = await app.request('/created');
    expect(res.status).toBe(201);
  });

  // ── ZodError → 400 ──────────────────────────────────────

  it('returns 400 with field details for ZodError', async () => {
    const app = createTestApp();
    const testSchema = z.object({ name: z.string().min(3) });

    app.post('/validate', async (c) => {
      const body = await c.req.json();
      testSchema.parse(body); // throws ZodError
      return c.json({ ok: true });
    });

    const res = await app.request('/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'ab' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation Error');
    expect(body.details).toBeDefined();
    expect(body.details.length).toBeGreaterThan(0);
    expect(body.details[0].field).toBe('name');
  });

  it('formats ZodError details with field and message', async () => {
    const app = createTestApp();
    const schema = z.object({ email: z.string().email() });

    app.post('/email', async (c) => {
      schema.parse(await c.req.json());
      return c.json({ ok: true });
    });

    const res = await app.request('/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details[0]).toHaveProperty('field');
    expect(body.details[0]).toHaveProperty('message');
  });

  // ── SyntaxError → 400 (FIX 10) ──────────────────────────

  it('returns 400 for malformed JSON (FIX 10)', async () => {
    const app = createTestApp();
    app.post('/json', async (c) => {
      await c.req.json(); // throws SyntaxError for malformed input
      return c.json({ ok: true });
    });

    const res = await app.request('/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{broken json',
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON in request body');
  });

  // ── generic Error → 500 ─────────────────────────────────

  it('returns 500 for generic errors', async () => {
    const app = createTestApp();
    app.get('/boom', () => {
      throw new Error('Something went wrong');
    });

    const res = await app.request('/boom');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Something went wrong');
  });

  it('returns generic message for non-Error throws', async () => {
    const app = createTestApp();
    app.get('/string-throw', () => {
      throw 'raw string error';
    });

    const res = await app.request('/string-throw');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal Server Error');
  });
});
