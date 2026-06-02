import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema, users } from '@flownote/shared';
import { db } from '../lib/db';
import { signToken } from '../lib/auth';
import { authGuard } from '../middleware/auth';
import { eq } from 'drizzle-orm';

const auth = new Hono();

// POST /api/v1/auth/register
auth.post('/register', async (c) => {
  const body = registerSchema.parse(await c.req.json());

  // 检查用户名/邮箱唯一性
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email));

  if (existing.length > 0) {
    return c.json({ error: '邮箱已被注册' }, 409);
  }

  const nameCheck = await db
    .select()
    .from(users)
    .where(eq(users.username, body.username));

  if (nameCheck.length > 0) {
    return c.json({ error: '用户名已被占用' }, 409);
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const [user] = await db
    .insert(users)
    .values({
      username: body.username,
      email: body.email,
      password: hashedPassword,
    })
    .returning();

  const token = await signToken(user);

  return c.json(
    {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    },
    201
  );
});

// POST /api/v1/auth/login
auth.post('/login', async (c) => {
  const body = loginSchema.parse(await c.req.json());

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email));

  if (!user) {
    return c.json({ error: '邮箱或密码错误' }, 401);
  }

  const valid = await bcrypt.compare(body.password, user.password);

  if (!valid) {
    return c.json({ error: '邮箱或密码错误' }, 401);
  }

  const token = await signToken(user);

  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
});

// GET /api/v1/auth/profile（需 JWT）
auth.get('/profile', authGuard, async (c) => {
  const userId = c.get('userId');

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      avatar: users.avatar,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return c.json({ error: '用户不存在' }, 404);
  }

  return c.json(user);
});

export default auth;
