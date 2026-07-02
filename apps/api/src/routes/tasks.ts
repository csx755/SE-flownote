import { Hono } from 'hono';
import { eq, and, asc, desc, sql, count } from 'drizzle-orm';
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

// GET /api/v1/tasks — 支持筛选和排序
// ?status=&priority=&sortBy=createdAt|dueDate|priority&order=asc|desc
tasksRoute.get('/', async (c) => {
  const query = taskQuerySchema.parse(c.req.query());
  const userId = c.get('userId');

  const conditions = [eq(tasks.userId, userId)];

  if (query.status) {
    conditions.push(eq(tasks.status, query.status));
  }

  if (query.priority) {
    conditions.push(eq(tasks.priority, query.priority));
  }

  if (query.folder) {
    conditions.push(eq(tasks.folder, query.folder));
  }

  const sortCol = {
    createdAt: tasks.createdAt,
    dueDate: tasks.dueDate,
    priority: tasks.priority,
  }[query.sortBy];

  const orderFn = query.order === 'asc' ? asc : desc;

  const list = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(orderFn(sortCol))
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
      folder: body.folder || null,
      userId,
    })
    .returning();

  return c.json(task, 201);
});

// ═══ /stats 必须在 /:id 前面，否则 "stats" 会被 :id 匹配 ═══

// GET /api/v1/tasks/stats — 任务统计
tasksRoute.get('/stats', async (c) => {
  const userId = c.get('userId');

  const [row] = await db
    .select({
      total: count(),
      todo: sql<number>`COUNT(*) FILTER (WHERE status = 'TODO')`.mapWith(Number),
      inProgress: sql<number>`COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')`.mapWith(Number),
      done: sql<number>`COUNT(*) FILTER (WHERE status = 'DONE')`.mapWith(Number),
      overdue: sql<number>`COUNT(*) FILTER (WHERE status IN ('TODO', 'IN_PROGRESS') AND due_date IS NOT NULL AND due_date < NOW())`.mapWith(Number),
    })
    .from(tasks)
    .where(eq(tasks.userId, userId));

  return c.json(row);
});

// ═══ /:id 参数化路由放最后 ═══

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
