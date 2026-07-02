import { z } from 'zod';

export const createPageSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255),
  content: z.string().default(''),
  folder: z.string().max(255).optional(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255).optional(),
  content: z.string().optional(),
  isArchived: z.boolean().optional(),
  folder: z.string().max(255).optional(),
});

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  folder: z.string().optional(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
