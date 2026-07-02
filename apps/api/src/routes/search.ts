import { Hono } from 'hono';
import { like, or, eq, and, inArray } from 'drizzle-orm';
import {
  searchQuerySchema,
  notes,
  knowledgePages,
  tasks,
  tags,
  noteTags,
  pageTags,
  taskTags,
} from '@flownote/shared';
import { db } from '../lib/db';
import { authGuard } from '../middleware/auth';

const searchRoute = new Hono();

searchRoute.use('*', authGuard);

// GET /api/v1/search?q=keyword&type=all|notes|pages|tasks
searchRoute.get('/', async (c) => {
  const query = searchQuerySchema.parse(c.req.query());
  const userId = c.get('userId');
  const keyword = `%${query.q}%`;

  const results: Array<{
    type: string;
    id: number;
    title: string;
    snippet: string;
    updatedAt: string;
  }> = [];

  // ── 搜索内容 ───────────────────────────────────────

  if (query.type === 'all' || query.type === 'notes') {
    const noteResults = await db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), like(notes.content, keyword)))
      .limit(20);

    for (const n of noteResults) {
      results.push({
        type: 'note', id: n.id,
        title: n.content.slice(0, 40),
        snippet: excerpt(n.content, query.q),
        updatedAt: n.updatedAt.toISOString(),
      });
    }
  }

  if (query.type === 'all' || query.type === 'pages') {
    const pageResults = await db
      .select()
      .from(knowledgePages)
      .where(and(eq(knowledgePages.userId, userId),
        or(like(knowledgePages.title, keyword), like(knowledgePages.content, keyword))))
      .limit(20);

    for (const p of pageResults) {
      results.push({
        type: 'page', id: p.id, title: p.title,
        snippet: excerpt(p.content, query.q),
        updatedAt: p.updatedAt.toISOString(),
      });
    }
  }

  if (query.type === 'all' || query.type === 'tasks') {
    const taskResults = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId),
        or(like(tasks.title, keyword), like(tasks.description, keyword))))
      .limit(20);

    for (const t of taskResults) {
      results.push({
        type: 'task', id: t.id, title: t.title,
        snippet: excerpt(t.description || '', query.q),
        updatedAt: t.updatedAt.toISOString(),
      });
    }
  }

  // ── 搜索标签 ───────────────────────────────────────

  // 找到匹配关键字的标签
  const matchingTags = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(and(eq(tags.userId, userId), like(tags.name, keyword)));

  if (matchingTags.length > 0) {
    const tagIds = matchingTags.map(t => t.id);

    // 标记已收录的实体，避免重复
    const seen = new Set(results.map(r => `${r.type}:${r.id}`));

    if (query.type === 'all' || query.type === 'notes') {
      const taggedNotes = await db
        .select({ id: notes.id, content: notes.content, updatedAt: notes.updatedAt })
        .from(noteTags)
        .innerJoin(notes, and(eq(noteTags.noteId, notes.id), eq(notes.userId, userId)))
        .where(inArray(noteTags.tagId, tagIds))
        .limit(10);

      for (const n of taggedNotes) {
        if (seen.has(`note:${n.id}`)) continue;
        seen.add(`note:${n.id}`);
        results.push({
          type: 'note', id: n.id,
          title: n.content.slice(0, 40),
          snippet: matchingTags.filter(t =>
            tagIds.includes(t.id)).map(t => `#${t.name}`).join(' '),
          updatedAt: n.updatedAt.toISOString(),
        });
      }
    }

    if (query.type === 'all' || query.type === 'pages') {
      const taggedPages = await db
        .select({ id: knowledgePages.id, title: knowledgePages.title, content: knowledgePages.content, updatedAt: knowledgePages.updatedAt })
        .from(pageTags)
        .innerJoin(knowledgePages, and(eq(pageTags.pageId, knowledgePages.id), eq(knowledgePages.userId, userId)))
        .where(inArray(pageTags.tagId, tagIds))
        .limit(10);

      for (const p of taggedPages) {
        if (seen.has(`page:${p.id}`)) continue;
        seen.add(`page:${p.id}`);
        results.push({
          type: 'page', id: p.id, title: p.title,
          snippet: matchingTags.filter(t =>
            tagIds.includes(t.id)).map(t => `#${t.name}`).join(' '),
          updatedAt: p.updatedAt.toISOString(),
        });
      }
    }

    if (query.type === 'all' || query.type === 'tasks') {
      const taggedTasks = await db
        .select({ id: tasks.id, title: tasks.title, description: tasks.description, updatedAt: tasks.updatedAt })
        .from(taskTags)
        .innerJoin(tasks, and(eq(taskTags.taskId, tasks.id), eq(tasks.userId, userId)))
        .where(inArray(taskTags.tagId, tagIds))
        .limit(10);

      for (const t of taggedTasks) {
        if (seen.has(`task:${t.id}`)) continue;
        seen.add(`task:${t.id}`);
        results.push({
          type: 'task', id: t.id, title: t.title,
          snippet: matchingTags.filter(tg =>
            tagIds.includes(tg.id)).map(tg => `#${tg.name}`).join(' '),
          updatedAt: t.updatedAt.toISOString(),
        });
      }
    }
  }

  return c.json({ results });
});

function excerpt(text: string, keyword: string, context = 40): string {
  if (!text) return '';
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return text.slice(0, context * 2);
  const start = Math.max(0, idx - context);
  const end = Math.min(text.length, idx + keyword.length + context);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return prefix + text.slice(start, end) + suffix;
}

export default searchRoute;
