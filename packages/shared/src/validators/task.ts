import { z } from 'zod';

// ISO 8601 datetime（含时区/偏移）或纯日期 YYYY-MM-DD
// 前端 <input type="date"> 发送 YYYY-MM-DD，需同时兼容
const dueDateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: '无效的日期格式' },
);

export const createTaskSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: dueDateSchema.optional(),
  sourceType: z.enum(['NOTE', 'KNOWLEDGE_PAGE']).optional(),
  sourceId: z.number().int().positive().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: dueDateSchema.optional(),
});

export const taskQuerySchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
