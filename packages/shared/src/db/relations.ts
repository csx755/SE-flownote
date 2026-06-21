import { relations } from 'drizzle-orm';
import {
  users, notes, knowledgePages, tasks,
  tags, noteTags, pageTags, taskTags,
} from './schema.ts';

// ── User Relations ─────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  pages: many(knowledgePages),
  tasks: many(tasks),
  tags: many(tags),
}));

// ── Note Relations ─────────────────────────────────────

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  noteTags: many(noteTags),
}));

// ── Knowledge Page Relations ───────────────────────────

export const knowledgePagesRelations = relations(knowledgePages, ({ one, many }) => ({
  user: one(users, {
    fields: [knowledgePages.userId],
    references: [users.id],
  }),
  pageTags: many(pageTags),
}));

// ── Task Relations ─────────────────────────────────────

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  taskTags: many(taskTags),
}));

// ── Tag Relations ──────────────────────────────────────

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  noteTags: many(noteTags),
  pageTags: many(pageTags),
  taskTags: many(taskTags),
}));

// ── Junction Relations ─────────────────────────────────

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, { fields: [noteTags.noteId], references: [notes.id] }),
  tag: one(tags, { fields: [noteTags.tagId], references: [tags.id] }),
}));

export const pageTagsRelations = relations(pageTags, ({ one }) => ({
  page: one(knowledgePages, { fields: [pageTags.pageId], references: [knowledgePages.id] }),
  tag: one(tags, { fields: [pageTags.tagId], references: [tags.id] }),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, { fields: [taskTags.taskId], references: [tasks.id] }),
  tag: one(tags, { fields: [taskTags.tagId], references: [tags.id] }),
}));
