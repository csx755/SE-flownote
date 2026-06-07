import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  tasks,
} from '@flownote/shared';
import { db } from '../lib/db';
import { authGuard } from '../middleware/auth';

const tasksRoute = new Hono();

tasksRoute.use('*', authGuard);

// GET /api/v1/tasks
tasksRoute.get('/', async (c) => {
  const query = taskQuerySchema.parse(c.req.query());
  const userId = c.get('userId');

  const conditions = [eq(tasks.userId, userId)];

  if (query.status) {
    conditions.push(eq(tasks.status, query.status));
  }

  const list = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  return c.json(list);
});

// POST /api/v1/tasks
tasksRoute.post('/', async (c) => {
  const body = createTaskSchema.parse(await c.req.json());
  const userId = c.get('userId');

  const [task] = await db
    .insert(tasks)
    .values({
      title: body.title,
      description: body.description,
      priority: body.priority,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      userId,
    })
    .returning();

  return c.json(task, 201);
});

// GET /api/v1/tasks/:id
tasksRoute.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const userId = c.get('userId');

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

  if (!task) {
    return c.json({ error: '任务不存在' }, 404);
  }

  return c.json(task);
});

// PATCH /api/v1/tasks/:id
tasksRoute.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const body = updateTaskSchema.parse(await c.req.json());

  if (Object.keys(body).length === 0) {
    return c.json({ error: '请求体不能为空' }, 400);
  }

  const userId = c.get('userId');

  // FIX 6: PATCH 也需将 dueDate 字符串转为 Date，与 POST 保持一致
  const updateData = {
    ...body,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning();

  if (!updated) {
    return c.json({ error: '任务不存在' }, 404);
  }

  return c.json(updated);
});

// DELETE /api/v1/tasks/:id
tasksRoute.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const userId = c.get('userId');

  const [deleted] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning();

  if (!deleted) {
    return c.json({ error: '任务不存在' }, 404);
  }

  return c.json({ success: true });
});

export default tasksRoute;
