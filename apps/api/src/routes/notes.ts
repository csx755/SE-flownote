import { Hono } from 'hono';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
  convertNoteSchema,
  notes,
  knowledgePages,
  tasks,
  noteTags,
  pageTags,
  taskTags,
  tags,
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

  if (query.folder) {
    conditions.push(eq(notes.folder, query.folder));
  }

  // FIX 5: 实现日期范围过滤（startDate/endDate 之前被解析但丢弃）
  if (query.startDate) {
    conditions.push(gte(notes.createdAt, new Date(query.startDate)));
  }
  if (query.endDate) {
    conditions.push(lte(notes.createdAt, new Date(query.endDate)));
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
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
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
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const body = updateNoteSchema.parse(await c.req.json());

  // FIX 9: 拒绝空 body，避免生成无效 SQL
  if (Object.keys(body).length === 0) {
    return c.json({ error: '请求体不能为空' }, 400);
  }

  const userId = c.get('userId');

  // FIX 7: mutation WHERE 包含 userId 纵深防御
  const [updated] = await db
    .update(notes)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();

  if (!updated) {
    return c.json({ error: '便签不存在' }, 404);
  }

  return c.json(updated);
});

// DELETE /api/v1/notes/:id
notesRoute.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const userId = c.get('userId');

  // FIX 7: DELETE 的 WHERE 包含 userId，一次查询完成鉴权+删除
  const [deleted] = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();

  if (!deleted) {
    return c.json({ error: '便签不存在' }, 404);
  }

  return c.json({ success: true });
});

// POST /api/v1/notes/:id/convert
notesRoute.post('/:id/convert', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: '无效 ID' }, 400);
  const body = convertNoteSchema.parse(await c.req.json());
  const userId = c.get('userId');

  // 事务包裹检查+insert+update，防 TOCTOU 竞态和孤儿数据
  try {
    const result = await db.transaction(async (tx) => {
      const [note] = await tx
        .select()
        .from(notes)
        .where(and(eq(notes.id, id), eq(notes.userId, userId)))
        .for('update');

      if (!note) {
        throw new Error('NOT_FOUND');
      }

      // 读取便签的标签（用于复制到目标实体）
      const noteTagRows = await tx
        .select({ tagId: noteTags.tagId })
        .from(noteTags)
        .where(eq(noteTags.noteId, id));

      if (body.targetType === 'KNOWLEDGE_PAGE') {
        const [page] = await tx
          .insert(knowledgePages)
          .values({
            title: body.title || getFirstLine(note.content),
            content: note.content,
            userId,
          })
          .returning();

        await tx
          .update(notes)
          .set({ isMerged: true, mergedToId: page.id })
          .where(eq(notes.id, id));

        // 复制标签到知识页
        if (noteTagRows.length > 0) {
          await tx.insert(pageTags).values(
            noteTagRows.map(nt => ({ pageId: page.id, tagId: nt.tagId }))
          );
        }

        return c.json({ targetType: 'KNOWLEDGE_PAGE', target: page }, 201);
      }

      // TASK
      const [task] = await tx
        .insert(tasks)
        .values({
          title: body.title || getFirstLine(note.content),
          description: note.content,
          sourceType: 'NOTE',
          sourceId: note.id,
          userId,
        })
        .returning();

      await tx
        .update(notes)
        .set({ isMerged: true, mergedToId: task.id })
        .where(eq(notes.id, id));

      // 复制标签到任务
      if (noteTagRows.length > 0) {
        await tx.insert(taskTags).values(
          noteTagRows.map(nt => ({ taskId: task.id, tagId: nt.tagId }))
        );
      }

      return c.json({ targetType: 'TASK', target: task }, 201);
    });

    return result;
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return c.json({ error: '便签不存在' }, 404);
    }
    throw err;
  }
});

/** 从内容中提取第一行作为标题，去除 Markdown 标题前缀 */
function getFirstLine(content: string): string {
  const firstLine = content.split('\n')[0]?.trim() || '';
  // 去掉 # 前缀和首尾空白，截断到 255 字符
  return firstLine.replace(/^#{1,6}\s*/, '').slice(0, 255) || '未命名';
}

export default notesRoute;
