import { eq, and, ne, or, like } from 'drizzle-orm';
import { db } from './db';
import { knowledgePages } from '@flownote/shared';

/**
 * 查找所有引用了指定页面的其他页面。
 * 匹配规则：
 * 1. [[页面标题]] — Wiki 风格链接
 * 2. Markdown 内容包含页面标题的其他页面（排除自身）
 */
export async function findBacklinks(pageId: number, userId: number) {
  const [target] = await db
    .select({ title: knowledgePages.title })
    .from(knowledgePages)
    .where(and(eq(knowledgePages.id, pageId), eq(knowledgePages.userId, userId)));

  if (!target) return [];

  const wikiPattern = `[[${target.title}]]`;

  const backlinks = await db
    .select({
      id: knowledgePages.id,
      title: knowledgePages.title,
      updatedAt: knowledgePages.updatedAt,
    })
    .from(knowledgePages)
    .where(
      and(
        eq(knowledgePages.userId, userId),
        ne(knowledgePages.id, pageId),
        or(
          like(knowledgePages.content, `%${wikiPattern}%`),
          like(knowledgePages.content, `%${target.title}%`),
        ),
      ),
    )
    .limit(50);

  return backlinks;
}
