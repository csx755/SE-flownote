import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { authGuard } from '../../middleware/auth';
import { SignJWT } from 'jose';

// Uses JWT_SECRET from vitest.config.ts env — must match what auth.ts reads

const TEST_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vitest-jwt-secret-key-for-testing-only'
);

async function createValidToken(
  userId = 1,
  email = 'test@example.com'
): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(TEST_JWT_SECRET);
}

function createTestApp() {
  const app = new Hono();
  // Apply authGuard to protected routes only
  app.use('/protected/*', authGuard);
  app.get('/protected/profile', (c) => {
    return c.json({
      userId: c.get('userId'),
      email: c.get('userEmail'),
    });
  });
  // Public route — no guard
  app.get('/public', (c) => c.json({ open: true }));
  return app;
}

// ============================================================
// authGuard middleware
// ============================================================

describe('authGuard', () => {
  // ── public routes ───────────────────────────────────────

  it('does not affect public routes without Auth header', async () => {
    const app = createTestApp();
    const res = await app.request('/public');
    expect(res.status).toBe(200);
  });

  // ── missing / malformed header ──────────────────────────

  it('returns 401 when Authorization header is missing', async () => {
    const app = createTestApp();
    const res = await app.request('/protected/profile');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('未提供认证令牌');
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const app = createTestApp();
    const res = await app.request('/protected/profile', {
      headers: { Authorization: 'Basic YWxhZGRpbjpvcGVuc2VzYW1l' },
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header has empty Bearer token', async () => {
    const app = createTestApp();
    const res = await app.request('/protected/profile', {
      headers: { Authorization: 'Bearer ' },
    });
    expect(res.status).toBe(401);
  });

  // ── double-space robustness (FIX 11) ────────────────────

  it('handles Bearer with extra whitespace (FIX 11)', async () => {
    const app = createTestApp();
    const token = await createValidToken();
    // Double space after Bearer — trim() handles it
    const res = await app.request('/protected/profile', {
      headers: { Authorization: `Bearer  ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe(1);
  });

  // ── invalid token ───────────────────────────────────────

  it('returns 401 for invalid token', async () => {
    const app = createTestApp();
    const res = await app.request('/protected/profile', {
      headers: { Authorization: 'Bearer invalid-token-here' },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('无效或已过期');
  });

  it('returns 401 for token signed with wrong secret', async () => {
    const app = createTestApp();
    const wrongSecret = new TextEncoder().encode('completely-different-key');
    const badToken = await new SignJWT({
      userId: 1,
      email: 'test@test.com',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(wrongSecret);

    const res = await app.request('/protected/profile', {
      headers: { Authorization: `Bearer ${badToken}` },
    });
    expect(res.status).toBe(401);
  });

  // ── valid token ─────────────────────────────────────────

  it('sets userId and userEmail context vars with valid token', async () => {
    const app = createTestApp();
    const token = await createValidToken(42, 'user42@example.com');

    const res = await app.request('/protected/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe(42);
    expect(body.email).toBe('user42@example.com');
  });

  it('preserves userId as number type in context', async () => {
    const app = createTestApp();
    const token = await createValidToken(99, 'num@test.com');

    const res = await app.request('/protected/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.userId).toBe('number');
  });
});
