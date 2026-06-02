import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from '../../lib/auth';
import { SignJWT } from 'jose';

// Uses JWT_SECRET from vitest.config.ts env

// ============================================================
// signToken
// ============================================================

describe('signToken', () => {
  it('returns a non-empty string', async () => {
    const token = await signToken({ id: 1, email: 'test@example.com' });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('produces a token that verifyToken can decode', async () => {
    const user = { id: 42, email: 'verify@test.com' };
    const token = await signToken(user);
    const payload = await verifyToken(token);
    expect(payload.userId).toBe(42);
    expect(payload.email).toBe('verify@test.com');
  });

  it('preserves userId as a number', async () => {
    const token = await signToken({ id: 100, email: 'num@test.com' });
    const payload = await verifyToken(token);
    expect(typeof payload.userId).toBe('number');
  });
});

// ============================================================
// verifyToken
// ============================================================

describe('verifyToken', () => {
  it('returns correct payload for a valid token', async () => {
    const token = await signToken({ id: 7, email: 'payload@test.com' });
    const payload = await verifyToken(token);
    expect(payload).toEqual({ userId: 7, email: 'payload@test.com' });
  });

  it('rejects a tampered token (wrong signature)', async () => {
    // Create a token signed with a different secret
    const wrongSecret = new TextEncoder().encode('wrong-secret-key!!');
    const tampered = await new SignJWT({ userId: 1, email: 'hack@test.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(wrongSecret);

    await expect(verifyToken(tampered)).rejects.toThrow();
  });

  it('rejects an empty string', async () => {
    await expect(verifyToken('')).rejects.toThrow();
  });

  it('rejects a completely random string', async () => {
    await expect(verifyToken('not.a.jwt.token')).rejects.toThrow();
  });

  it('rejects a token with missing userId (FIX 14 — payload validation)', async () => {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'vitest-fallback'
    );
    const badToken = await new SignJWT({ email: 'no-id@test.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    await expect(verifyToken(badToken)).rejects.toThrow(
      'Invalid token payload structure'
    );
  });

  it('rejects a token with missing email (FIX 14 — payload validation)', async () => {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'vitest-fallback'
    );
    const badToken = await new SignJWT({ userId: 99 })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    await expect(verifyToken(badToken)).rejects.toThrow(
      'Invalid token payload structure'
    );
  });

  it('rejects a token with userId as string (FIX 14 — type check)', async () => {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'vitest-fallback'
    );
    const badToken = await new SignJWT({
      userId: '123', // string instead of number
      email: 'test@test.com',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    await expect(verifyToken(badToken)).rejects.toThrow(
      'Invalid token payload structure'
    );
  });
});
