import { describe, expect, it } from 'vitest';
import { registerSchema, loginSchema } from '@flownote/shared';

// ============================================================
// registerSchema
// ============================================================

describe('registerSchema', () => {
  const validInput = {
    username: 'test_user',
    email: 'test@example.com',
    password: 'Passw0rd!',
  };

  it('accepts valid registration input', () => {
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  // ── username ──────────────────────────────────────────

  it('rejects username shorter than 3 characters', () => {
    const result = registerSchema.safeParse({ ...validInput, username: 'ab' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('至少 3 个字符');
    }
  });

  it('accepts username exactly at 3 characters (boundary)', () => {
    const result = registerSchema.safeParse({ ...validInput, username: 'abc' });
    expect(result.success).toBe(true);
  });

  it('rejects username longer than 50 characters', () => {
    const result = registerSchema.safeParse({
      ...validInput,
      username: 'a'.repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('最多 50 个字符');
    }
  });

  it('accepts username exactly at 50 characters (boundary)', () => {
    const result = registerSchema.safeParse({
      ...validInput,
      username: 'a'.repeat(50),
    });
    expect(result.success).toBe(true);
  });

  it('rejects username with special characters', () => {
    const badNames = ['test user', 'hello@world', 'name#1', '<script>'];
    for (const name of badNames) {
      const result = registerSchema.safeParse({ ...validInput, username: name });
      expect(result.success).toBe(false);
    }
  });

  it('accepts username with underscore, hyphen, and digits', () => {
    const result = registerSchema.safeParse({
      ...validInput,
      username: 'user_2024-test',
    });
    expect(result.success).toBe(true);
  });

  // ── email ──────────────────────────────────────────────

  it('rejects invalid email formats', () => {
    const badEmails = ['plaintext', 'missing@', '@missing.com', 'no domain'];
    for (const email of badEmails) {
      const result = registerSchema.safeParse({ ...validInput, email });
      expect(result.success).toBe(false);
    }
  });

  it('rejects email longer than 255 characters', () => {
    // 251 字符本地部分 + @x.co(5) = 256 > 255
    const longLocal = 'a'.repeat(251);
    const result = registerSchema.safeParse({
      ...validInput,
      email: `${longLocal}@x.co`,
    });
    expect(result.success).toBe(false);
  });

  it('accepts email exactly at 255 characters (boundary)', () => {
    // 250 字符本地部分 + @x.co(5) = 255
    const local = 'a'.repeat(250);
    const result = registerSchema.safeParse({
      ...validInput,
      email: `${local}@x.co`,
    });
    expect(result.success).toBe(true);
  });

  // ── password ───────────────────────────────────────────

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: 'Ab1defg',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('至少 8 位');
    }
  });

  it('accepts password exactly at 8 characters (boundary)', () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: 'Ab1defgh',
    });
    expect(result.success).toBe(true);
  });

  it('rejects password without any letter', () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: '12345678',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('必须包含字母');
    }
  });

  it('rejects password without any digit', () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: 'abcdefgh',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('必须包含数字');
    }
  });

  it('accepts password with letters and digits (minimum valid)', () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: 'abcd1234',
    });
    expect(result.success).toBe(true);
  });

  // ── missing fields ─────────────────────────────────────

  it('rejects empty input', () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
    // Should have 3 issues: username, email, password
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
    }
  });
});

// ============================================================
// loginSchema
// ============================================================

describe('loginSchema', () => {
  const validInput = {
    email: 'user@example.com',
    password: 'anything',
  };

  it('accepts valid login input', () => {
    const result = loginSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ ...validInput, email: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({ ...validInput, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ ...validInput, password: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('请输入密码');
    }
  });
});
