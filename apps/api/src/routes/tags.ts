import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import {
  createTagSchema,
  updateTagSchema,
  tags,
  noteTags,
  pageTags,
  taskTags,
} from '@flownote/shared';
import { db } from '../lib/db';
import { authGuard } from '../middleware/auth';

const tagsRoute = new Hono();

tagsRoute.use('*', authGuard);

// GET /api/v1/tags — 用户标签列表
tagsRoute.get('/', async (c) => {
  const userId = c.get('userId');

  const list = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(desc(tags.id));

  return c.json(list);
});

// POST /api/v1/tags — 创建标签
tagsRoute.post('/', async (c) => {
  const body = createTagSchema.parse(await c.req.json());
  const userId = c.get('userId');

  const [existing] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.userId, userId), eq(tags.name, body.name)));

  if (existing) {
    return c.json({ error: '已存在同名标签' }, 409);
  }

  const [tag] = await db
    .insert(tags)
    .values({ name: body.name, userId })
    .returning();

  return c.json(tag, 201);
});

// ═══ /link 和 /entity 路由必须在 /:id 之前 ═══
// 否则 Hono 会把 "/link" 匹配成 :id 参数

// POST /api/v1/tags/link — 给任意实体添加标签
tagsRoute.post('/link', async (c) => {
  const body = await c.req.json();
  const { entityType, entityId, tagId } = body;

  if (!['note', 'page', 'task'].includes(entityType)) {
    return c.json({ error: '无效实体类型' }, 400);
  }

  const userId = c.get('userId');
  const [tag] = await db.select().from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)));
  if (!tag) return c.json({ error: '标签不存在' }, 404);

  if (entityType === 'note') {
    const [existing] = await db.select().from(noteTags)
      .where(and(eq(noteTags.noteId, entityId), eq(noteTags.tagId, tagId)));
    if (existing) return c.json({ error: '关联已存在' }, 409);
    await db.insert(noteTags).values({ noteId: entityId, tagId });
  } else if (entityType === 'page') {
    const [existing] = await db.select().from(pageTags)
      .where(and(eq(pageTags.pageId, entityId), eq(pageTags.tagId, tagId)));
    if (existing) return c.json({ error: '关联已存在' }, 409);
    await db.insert(pageTags).values({ pageId: entityId, tagId });
  } else {
    const [existing] = await db.select().from(taskTags)
      .where(and(eq(taskTags.taskId, entityId), eq(taskTags.tagId, tagId)));
    if (existing) return c.json({ error: '关联已存在' }, 409);
    await db.insert(taskTags).values({ taskId: entityId, tagId });
  }
  return c.json({ success: true }, 201);
});

// DELETE /api/v1/tags/link — 移除实体标签
tagsRoute.delete('/link', async (c) => {
  const body = await c.req.json();
  const { entityType, entityId, tagId } = body;

  if (!entityType || !['note', 'page', 'task'].includes(entityType)) {
    return c.json({ error: '无效实体类型' }, 400);
  }

  if (entityType === 'note') {
    await db
      .delete(noteTags)
      .where(and(eq(noteTags.noteId, entityId), eq(noteTags.tagId, tagId)));
  } else if (entityType === 'page') {
    await db
      .delete(pageTags)
      .where(and(eq(pageTags.pageId, entityId), eq(pageTags.tagId, tagId)));
  } else {
    await db
      .delete(taskTags)
      .where(and(eq(taskTags.taskId, entityId), eq(taskTags.tagId, tagId)));
  }

  return c.json({ success: true });
});

// GET /api/v1/tags/entity/:entityType/:entityId — 获取实体的标签
tagsRoute.get('/entity/:entityType/:entityId', async (c) => {
  const { entityType, entityId } = c.req.param();
  const eid = Number(entityId);

  if (!['note', 'page', 'task'].includes(entityType)) {
    return c.json({ error: '无效实体类型' }, 400);
  }

  let rows;
  if (entityType === 'note') {
    rows = await db
      .select({ tag: tags })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(eq(noteTags.noteId, eid));
  } else if (entityType === 'page') {
    rows = await db
      .select({ tag: tags })
      .from(pageTags)
      .innerJoin(tags, eq(pageTags.tagId, tags.id))
      .where(eq(pageTags.pageId, eid));
  } else {
    rows = await db
      .select({ tag: tags })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(eq(taskTags.taskId, eid));
  }

  return c.json(rows.map(r => r.tag));
});

// ═══ /:id 参数化路由放在最后 ═══

// PATCH /api/v1/tags/:id — 重命名标签
tagsRoute.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const body = updateTagSchema.parse(await c.req.json());
  const userId = c.get('userId');

  const [updated] = await db
    .update(tags)
    .set({ name: body.name })
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .returning();

  if (!updated) {
    return c.json({ error: '标签不存在' }, 404);
  }

  return c.json(updated);
});

// DELETE /api/v1/tags/:id — 删除标签
tagsRoute.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const userId = c.get('userId');

  const [deleted] = await db
    .delete(tags)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .returning();

  if (!deleted) {
    return c.json({ error: '标签不存在' }, 404);
  }

  return c.json({ success: true });
});

export default tagsRoute;
