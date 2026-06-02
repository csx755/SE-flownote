import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ── Enums ──────────────────────────────────────────────

export const taskStatusEnum = pgEnum('task_status', [
  'TODO',
  'IN_PROGRESS',
  'DONE',
]);

export const priorityEnum = pgEnum('priority', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
]);

export const contentTypeEnum = pgEnum('content_type', [
  'TEXT',
  'MARKDOWN',
]);

export const sourceTypeEnum = pgEnum('source_type', [
  'NOTE',
  'KNOWLEDGE_PAGE',
]);

// ── Users ──────────────────────────────────────────────

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // bcrypt hash
  avatar: varchar('avatar', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

// ── Notes ──────────────────────────────────────────────

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  contentType: contentTypeEnum('content_type').notNull().default('TEXT'),
  isArchived: boolean('is_archived').notNull().default(false),
  isMerged: boolean('is_merged').notNull().default(false),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  mergedToId: integer('merged_to_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

// ── Knowledge Pages ────────────────────────────────────

export const knowledgePages = pgTable('knowledge_pages', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull().default(''),
  isArchived: boolean('is_archived').notNull().default(false),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

// ── Tasks ──────────────────────────────────────────────

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('TODO'),
  priority: priorityEnum('priority').notNull().default('MEDIUM'),
  dueDate: timestamp('due_date'),
  sourceType: sourceTypeEnum('source_type'),
  sourceId: integer('source_id'),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});
