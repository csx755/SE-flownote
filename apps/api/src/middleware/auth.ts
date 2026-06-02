import type { Context, Next } from 'hono';
import { verifyToken } from '../lib/auth';

declare module 'hono' {
  interface ContextVariableMap {
    userId: number;
    userEmail: string;
  }
}

export async function authGuard(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未提供认证令牌' }, 401);
  }

  // FIX 11: trim 处理可能存在的双空格或首尾空白
  const token = authHeader.slice(7).trim();

  try {
    const payload = await verifyToken(token);
    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    await next();
  } catch {
    return c.json({ error: '认证令牌无效或已过期' }, 401);
  }
}
