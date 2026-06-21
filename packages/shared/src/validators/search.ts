import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1, '搜索关键词不能为空').max(200),
  type: z.enum(['all', 'notes', 'pages', 'tasks']).default('all'),
});
