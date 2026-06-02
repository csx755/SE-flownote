import { relations } from 'drizzle-orm';
import { users, notes, knowledgePages, tasks } from './schema.ts';

// ── User Relations ─────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  pages: many(knowledgePages),
  tasks: many(tasks),
}));

// ── Note Relations ─────────────────────────────────────

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));

// ── Knowledge Page Relations ───────────────────────────

export const knowledgePagesRelations = relations(knowledgePages, ({ one }) => ({
  user: one(users, {
    fields: [knowledgePages.userId],
    references: [users.id],
  }),
}));

// ── Task Relations ─────────────────────────────────────

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));
