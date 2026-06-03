import { knowledgePages } from '../db/schema';

export type Page = typeof knowledgePages.$inferSelect;
export type NewPage = typeof knowledgePages.$inferInsert;
