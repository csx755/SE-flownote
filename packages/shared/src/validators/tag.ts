import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1, '标签名不能为空').max(50, '标签名最多 50 个字符'),
});

export const updateTagSchema = z.object({
  name: z.string().min(1, '标签名不能为空').max(50, '标签名最多 50 个字符'),
});
