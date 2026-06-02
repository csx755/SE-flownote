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

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token);
    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    await next();
  } catch {
    return c.json({ error: '认证令牌无效或已过期' }, 401);
  }
}
