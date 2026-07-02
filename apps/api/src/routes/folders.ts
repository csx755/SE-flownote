import { Hono } from 'hono';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { notes, knowledgePages, tasks } from '@flownote/shared';
import { db } from '../lib/db';
import { authGuard } from '../middleware/auth';

const foldersRoute = new Hono();

foldersRoute.use('*', authGuard);

// GET /api/v1/folders?type=notes|pages|tasks
foldersRoute.get('/', async (c) => {
  const type = c.req.query('type') || 'pages';
  if (!['notes', 'pages', 'tasks'].includes(type)) {
    return c.json({ error: 'type 仅支持 notes/pages/tasks' }, 400);
  }
  const userId = c.get('userId');

  const table = type === 'notes' ? notes : type === 'pages' ? knowledgePages : tasks;
  const col = table.folder;

  const rows = await db
    .selectDistinct({ folder: col })
    .from(table)
    .where(and(eq(table.userId, userId), isNotNull(col)));

  // 同时查询每个文件夹的实体数量
  const countRows = await db
    .select({ folder: col, count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
    .from(table)
    .where(and(eq(table.userId, userId), isNotNull(col)))
    .groupBy(col);

  const folderCounts = new Map<string, number>();
  for (const r of countRows) {
    if (r.folder) folderCounts.set(r.folder, r.count);
  }

  const folders = [...new Set(rows.map(r => r.folder).filter(Boolean))].sort();

  // 构建文件夹树
  interface TreeNode {
    name: string;
    path: string;
    count: number;
    children: TreeNode[];
  }

  const rootMap = new Map<string, TreeNode>();

  for (const fullPath of folders) {
    const parts = fullPath!.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];

      if (!rootMap.has(currentPath)) {
        // 该节点的 count：自身 + 所有子路径的 count 总和
        const selfCount = folderCounts.get(currentPath) || 0;
        const node: TreeNode = { name: parts[i], path: currentPath, count: selfCount, children: [] };
        rootMap.set(currentPath, node);

        if (parentPath) {
          const parent = rootMap.get(parentPath);
          if (parent && !parent.children.find(c => c.path === currentPath)) {
            parent.children.push(node);
          }
        }
      }
    }
  }

  // 递归累加子节点数量到父节点
  function sumCounts(node: TreeNode): number {
    for (const child of node.children) {
      node.count += sumCounts(child);
    }
    return node.count;
  }

  const tree = [...rootMap.values()].filter(n => !n.path.includes('/'));
  for (const root of tree) {
    sumCounts(root);
  }

  return c.json(tree);
});

export default foldersRoute;
