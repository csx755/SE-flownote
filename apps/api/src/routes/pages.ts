import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import {
  createPageSchema,
  updatePageSchema,
  pageQuerySchema,
  knowledgePages,
  tasks,
  pageTags,
  taskTags,
} from '@flownote/shared';
import { db } from '../lib/db';
import { authGuard } from '../middleware/auth';
import { findBacklinks } from '../lib/backlinks';

const pagesRoute = new Hono();

pagesRoute.use('*', authGuard);

// GET /api/v1/pages
pagesRoute.get('/', async (c) => {
  const query = pageQuerySchema.parse(c.req.query());
  const userId = c.get('userId');

  const conditions = [eq(knowledgePages.userId, userId)];
  if (query.folder) {
    conditions.push(eq(knowledgePages.folder, query.folder));
  }

  const list = await db
    .select()
    .from(knowledgePages)
    .where(and(...conditions))
    .orderBy(desc(knowledgePages.updatedAt))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  return c.json(list);
});

// ═══ /export 路由必须在 /:id 前面 ═══

// GET /api/v1/pages/export/:id — 导出 .md 或 .txt
pagesRoute.get('/export/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const format = c.req.query('format') || 'md';
  if (!['md', 'txt'].includes(format)) return c.json({ error: '格式仅支持 md 或 txt' }, 400);
  const userId = c.get('userId');

  const [page] = await db
    .select()
    .from(knowledgePages)
    .where(and(eq(knowledgePages.id, id), eq(knowledgePages.userId, userId)));

  if (!page) return c.json({ error: '知识页面不存在' }, 404);

  const ext = format === 'txt' ? 'txt' : 'md';
  const mime = format === 'txt' ? 'text/plain' : 'text/markdown';
  const filename = `${encodeURIComponent(page.title || 'untitled')}.${ext}`;

  return new Response(page.content, {
    headers: {
      'Content-Type': `${mime}; charset=utf-8`,
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
    },
  });
});

// POST /api/v1/pages
pagesRoute.post('/', async (c) => {
  const body = createPageSchema.parse(await c.req.json());
  const userId = c.get('userId');

  const [page] = await db
    .insert(knowledgePages)
    .values({
      title: body.title,
      content: body.content,
      folder: body.folder || null,
      userId,
    })
    .returning();

  return c.json(page, 201);
});

// GET /api/v1/pages/:id
pagesRoute.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const userId = c.get('userId');

  const [page] = await db
    .select()
    .from(knowledgePages)
    .where(and(eq(knowledgePages.id, id), eq(knowledgePages.userId, userId)));

  if (!page) {
    return c.json({ error: '知识页面不存在' }, 404);
  }

  return c.json(page);
});

// PATCH /api/v1/pages/:id
pagesRoute.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const body = updatePageSchema.parse(await c.req.json());

  if (Object.keys(body).length === 0) {
    return c.json({ error: '请求体不能为空' }, 400);
  }

  const userId = c.get('userId');

  const [updated] = await db
    .update(knowledgePages)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(knowledgePages.id, id), eq(knowledgePages.userId, userId)))
    .returning();

  if (!updated) {
    return c.json({ error: '知识页面不存在' }, 404);
  }

  return c.json(updated);
});

// DELETE /api/v1/pages/:id
pagesRoute.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const userId = c.get('userId');

  const [deleted] = await db
    .delete(knowledgePages)
    .where(and(eq(knowledgePages.id, id), eq(knowledgePages.userId, userId)))
    .returning();

  if (!deleted) {
    return c.json({ error: '知识页面不存在' }, 404);
  }

  return c.json({ success: true });
});

// GET /api/v1/pages/:id/backlinks — 页面反向链接
pagesRoute.get('/:id/backlinks', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const userId = c.get('userId');

  const backlinks = await findBacklinks(id, userId);
  return c.json({ backlinks });
});

// POST /api/v1/pages/:id/convert-to-task — 知识页面转任务
pagesRoute.post('/:id/convert-to-task', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const userId = c.get('userId');

  try {
    const result = await db.transaction(async (tx) => {
      const [page] = await tx
        .select()
        .from(knowledgePages)
        .where(and(eq(knowledgePages.id, id), eq(knowledgePages.userId, userId)))
        .for('update');

      if (!page) throw new Error('NOT_FOUND');

      const [task] = await tx
        .insert(tasks)
        .values({
          title: page.title,
          description: page.content,
          sourceType: 'KNOWLEDGE_PAGE',
          sourceId: page.id,
          userId,
        })
        .returning();

      // 复制标签
      const pageTagRows = await tx
        .select({ tagId: pageTags.tagId })
        .from(pageTags)
        .where(eq(pageTags.pageId, id));

      if (pageTagRows.length > 0) {
        await tx.insert(taskTags).values(
          pageTagRows.map(pt => ({ taskId: task.id, tagId: pt.tagId })),
        );
      }

      return c.json({ targetType: 'TASK', target: task }, 201);
    });

    return result;
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return c.json({ error: '知识页面不存在' }, 404);
    }
    throw err;
  }
});

export default pagesRoute;
