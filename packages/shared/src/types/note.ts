import { notes } from '../db/schema';

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
