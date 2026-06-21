import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import {
  users, notes, knowledgePages, tasks,
  tags, noteTags, pageTags, taskTags,
} from '@flownote/shared';
import {
  usersRelations,
  notesRelations,
  knowledgePagesRelations,
  tasksRelations,
  tagsRelations,
  noteTagsRelations,
  pageTagsRelations,
  taskTagsRelations,
} from '@flownote/shared';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 防止 DB 断连时 Node 进程崩溃（node-postgres 文档要求）
pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err);
});

const schema = {
  users,
  notes,
  knowledgePages,
  tasks,
  tags,
  noteTags,
  pageTags,
  taskTags,
  usersRelations,
  notesRelations,
  knowledgePagesRelations,
  tasksRelations,
  tagsRelations,
  noteTagsRelations,
  pageTagsRelations,
  taskTagsRelations,
};

export const db = drizzle(pool, { schema });
