import { z } from 'zod';

export const createNoteSchema = z.object({
  content: z.string().min(1, '内容不能为空'),
  contentType: z.enum(['TEXT', 'MARKDOWN']).default('TEXT'),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1, '内容不能为空').optional(),
  contentType: z.enum(['TEXT', 'MARKDOWN']).optional(),
  isArchived: z.boolean().optional(),
  folder: z.string().max(255).optional(),
});

export const noteQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  archived: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  folder: z.string().optional(),
});

export const convertNoteSchema = z.object({
  targetType: z.enum(['KNOWLEDGE_PAGE', 'TASK']),
  title: z.string().min(1, '标题不能为空').optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type ConvertNoteInput = z.infer<typeof convertNoteSchema>;
