import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import {
  createPageSchema,
  updatePageSchema,
  pageQuerySchema,
  knowledgePages,
} from '@flownote/shared';
import { db } from '../lib/db';
import { authGuard } from '../middleware/auth';

const pagesRoute = new Hono();

pagesRoute.use('*', authGuard);

// GET /api/v1/pages
pagesRoute.get('/', async (c) => {
  const query = pageQuerySchema.parse(c.req.query());
  const userId = c.get('userId');

  const list = await db
    .select()
    .from(knowledgePages)
    .where(eq(knowledgePages.userId, userId))
    .orderBy(desc(knowledgePages.updatedAt))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  return c.json(list);
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
      userId,
    })
    .returning();

  return c.json(page, 201);
});

// GET /api/v1/pages/:id
pagesRoute.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
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
  const body = updatePageSchema.parse(await c.req.json());
  const userId = c.get('userId');

  const [existing] = await db
    .select()
    .from(knowledgePages)
    .where(and(eq(knowledgePages.id, id), eq(knowledgePages.userId, userId)));

  if (!existing) {
    return c.json({ error: '知识页面不存在' }, 404);
  }

  const [updated] = await db
    .update(knowledgePages)
    .set(body)
    .where(eq(knowledgePages.id, id))
    .returning();

  return c.json(updated);
});

// DELETE /api/v1/pages/:id
pagesRoute.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const userId = c.get('userId');

  const [existing] = await db
    .select()
    .from(knowledgePages)
    .where(and(eq(knowledgePages.id, id), eq(knowledgePages.userId, userId)));

  if (!existing) {
    return c.json({ error: '知识页面不存在' }, 404);
  }

  await db.delete(knowledgePages).where(eq(knowledgePages.id, id));

  return c.json({ success: true });
});

export default pagesRoute;
