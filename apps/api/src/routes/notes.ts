import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
  convertNoteSchema,
  notes,
  knowledgePages,
  tasks,
} from '@flownote/shared';
import { db } from '../lib/db';
import { authGuard } from '../middleware/auth';

const notesRoute = new Hono();

// 所有接口需要认证
notesRoute.use('*', authGuard);

// GET /api/v1/notes
notesRoute.get('/', async (c) => {
  const query = noteQuerySchema.parse(c.req.query());
  const userId = c.get('userId');

  const conditions = [eq(notes.userId, userId)];

  if (query.archived !== undefined) {
    conditions.push(eq(notes.isArchived, query.archived));
  }

  const list = await db
    .select()
    .from(notes)
    .where(and(...conditions))
    .orderBy(desc(notes.createdAt))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);

  return c.json(list);
});

// POST /api/v1/notes
notesRoute.post('/', async (c) => {
  const body = createNoteSchema.parse(await c.req.json());
  const userId = c.get('userId');

  const [note] = await db
    .insert(notes)
    .values({
      content: body.content,
      contentType: body.contentType,
      userId,
    })
    .returning();

  return c.json(note, 201);
});

// GET /api/v1/notes/:id
notesRoute.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const userId = c.get('userId');

  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));

  if (!note) {
    return c.json({ error: '便签不存在' }, 404);
  }

  return c.json(note);
});

// PATCH /api/v1/notes/:id
notesRoute.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = updateNoteSchema.parse(await c.req.json());
  const userId = c.get('userId');

  const [existing] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));

  if (!existing) {
    return c.json({ error: '便签不存在' }, 404);
  }

  const [updated] = await db
    .update(notes)
    .set(body)
    .where(eq(notes.id, id))
    .returning();

  return c.json(updated);
});

// DELETE /api/v1/notes/:id
notesRoute.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const userId = c.get('userId');

  const [existing] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));

  if (!existing) {
    return c.json({ error: '便签不存在' }, 404);
  }

  await db.delete(notes).where(eq(notes.id, id));

  return c.json({ success: true });
});

// POST /api/v1/notes/:id/convert
notesRoute.post('/:id/convert', async (c) => {
  const id = Number(c.req.param('id'));
  const body = convertNoteSchema.parse(await c.req.json());
  const userId = c.get('userId');

  const [note] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));

  if (!note) {
    return c.json({ error: '便签不存在' }, 404);
  }

  if (body.targetType === 'KNOWLEDGE_PAGE') {
    const [page] = await db
      .insert(knowledgePages)
      .values({
        title: body.title || note.content.slice(0, 20),
        content: note.content,
        userId,
      })
      .returning();

    await db
      .update(notes)
      .set({ isMerged: true, mergedToId: page.id })
      .where(eq(notes.id, id));

    return c.json({ targetType: 'KNOWLEDGE_PAGE', target: page }, 201);
  }

  // TASK
  const [task] = await db
    .insert(tasks)
    .values({
      title: body.title || note.content.slice(0, 30),
      description: note.content,
      sourceType: 'NOTE',
      sourceId: note.id,
      userId,
    })
    .returning();

  await db
    .update(notes)
    .set({ isMerged: true })
    .where(eq(notes.id, id));

  return c.json({ targetType: 'TASK', target: task }, 201);
});

export default notesRoute;
