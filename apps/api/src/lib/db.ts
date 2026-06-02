import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { users, notes, knowledgePages, tasks } from '@flownote/shared';
import {
  usersRelations,
  notesRelations,
  knowledgePagesRelations,
  tasksRelations,
} from '@flownote/shared';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const schema = {
  users,
  notes,
  knowledgePages,
  tasks,
  usersRelations,
  notesRelations,
  knowledgePagesRelations,
  tasksRelations,
};

export const db = drizzle(pool, { schema });
