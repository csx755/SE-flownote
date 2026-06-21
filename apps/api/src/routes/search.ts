import { Hono } from 'hono';
import { like, or, eq, and } from 'drizzle-orm';
import {
  searchQuerySchema,
  notes,
  knowledgePages,
  tasks,
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

  // 并行搜索三张表
  if (query.type === 'all' || query.type === 'notes') {
    const noteResults = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          like(notes.content, keyword),
        ),
      )
      .limit(20);

    for (const n of noteResults) {
      results.push({
        type: 'note',
        id: n.id,
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
      .where(
        and(
          eq(knowledgePages.userId, userId),
          or(
            like(knowledgePages.title, keyword),
            like(knowledgePages.content, keyword),
          ),
        ),
      )
      .limit(20);

    for (const p of pageResults) {
      results.push({
        type: 'page',
        id: p.id,
        title: p.title,
        snippet: excerpt(p.content, query.q),
        updatedAt: p.updatedAt.toISOString(),
      });
    }
  }

  if (query.type === 'all' || query.type === 'tasks') {
    const taskResults = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          or(
            like(tasks.title, keyword),
            like(tasks.description, keyword),
          ),
        ),
      )
      .limit(20);

    for (const t of taskResults) {
      results.push({
        type: 'task',
        id: t.id,
        title: t.title,
        snippet: excerpt(t.description || '', query.q),
        updatedAt: t.updatedAt.toISOString(),
      });
    }
  }

  return c.json({ results });
});

// 截取关键词周围的上下文作为片段
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
