import { z } from 'zod';

export const createPageSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255),
  content: z.string().default(''),
});

export const updatePageSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255).optional(),
  content: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
