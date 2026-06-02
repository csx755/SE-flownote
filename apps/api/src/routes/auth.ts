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

  // FIX 8: 事务包裹检查+插入，消除 TOCTOU 竞态
  const hashedPassword = await bcrypt.hash(body.password, 10);

  try {
    const [user] = await db.transaction(async (tx) => {
      // 在事务内检查唯一性（利用 PG 行锁）
      const existingEmail = await tx
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .for('update');

      if (existingEmail.length > 0) {
        throw new Error('EMAIL_EXISTS');
      }

      const existingName = await tx
        .select()
        .from(users)
        .where(eq(users.username, body.username))
        .for('update');

      if (existingName.length > 0) {
        throw new Error('USERNAME_EXISTS');
      }

      return tx
        .insert(users)
        .values({
          username: body.username,
          email: body.email,
          password: hashedPassword,
        })
        .returning();
    });

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
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'EMAIL_EXISTS') {
        return c.json({ error: '邮箱已被注册' }, 409);
      }
      if (err.message === 'USERNAME_EXISTS') {
        return c.json({ error: '用户名已被占用' }, 409);
      }
    }
    throw err; // 重新抛出让 errorHandler 处理
  }
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
