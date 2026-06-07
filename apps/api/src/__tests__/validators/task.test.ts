import { describe, expect, it } from 'vitest';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from '@flownote/shared';

// ============================================================
// createTaskSchema
// ============================================================

describe('createTaskSchema', () => {
  it('accepts valid input with minimal fields', () => {
    const result = createTaskSchema.safeParse({ title: 'My Task' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe('MEDIUM');
      expect('status' in result.data).toBe(false); // status is not in create schema
    }
  });

  it('defaults priority to MEDIUM', () => {
    const result = createTaskSchema.safeParse({ title: 'Task' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe('MEDIUM');
    }
  });

  it('accepts explicit priority', () => {
    const result = createTaskSchema.safeParse({
      title: 'Urgent task',
      priority: 'URGENT',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid ISO datetime dueDate', () => {
    const result = createTaskSchema.safeParse({
      title: 'Deadline',
      dueDate: '2025-06-15T12:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid dueDate format', () => {
    const result = createTaskSchema.safeParse({
      title: 'Bad date',
      dueDate: 'tomorrow',
    });
    expect(result.success).toBe(false);
  });

  // 边界：前端 <input type="date"> 发送 YYYY-MM-DD 格式
  it('accepts date-only dueDate (YYYY-MM-DD)', () => {
    const result = createTaskSchema.safeParse({
      title: 'DateOnly',
      dueDate: '2026-06-07',
    });
    expect(result.success).toBe(true);
  });

  // 边界：ISO datetime with timezone offset
  it('accepts ISO datetime with +08:00 offset', () => {
    const result = createTaskSchema.safeParse({
      title: 'ISO with offset',
      dueDate: '2026-06-07T23:59:59+08:00',
    });
    expect(result.success).toBe(true);
  });

  // 边界：毫秒精度
  it('accepts ISO datetime with milliseconds', () => {
    const result = createTaskSchema.safeParse({
      title: 'Milliseconds',
      dueDate: '2026-06-07T12:00:00.123Z',
    });
    expect(result.success).toBe(true);
  });

  // 边界：空字符串不会被误判为有效日期
  it('rejects empty string dueDate', () => {
    const result = createTaskSchema.safeParse({
      title: 'Empty date',
      dueDate: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('标题不能为空');
    }
  });

  it('rejects title longer than 255 chars', () => {
    const result = createTaskSchema.safeParse({ title: 'a'.repeat(256) });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod 内置英文消息，通过 code 验证
      expect(result.error.issues[0].code).toBe('too_big');
    }
  });

  it('accepts title exactly at 255 characters (boundary)', () => {
    const result = createTaskSchema.safeParse({ title: 'a'.repeat(255) });
    expect(result.success).toBe(true);
  });

  it('rejects invalid priority', () => {
    const result = createTaskSchema.safeParse({
      title: 'Task',
      priority: 'CRITICAL',
    });
    expect(result.success).toBe(false);
  });

  it('accepts sourceType and sourceId for linked tasks', () => {
    const result = createTaskSchema.safeParse({
      title: 'Linked task',
      sourceType: 'NOTE',
      sourceId: 42,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceType).toBe('NOTE');
      expect(result.data.sourceId).toBe(42);
    }
  });

  it('rejects negative sourceId', () => {
    const result = createTaskSchema.safeParse({
      title: 'Task',
      sourceId: -1,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// updateTaskSchema
// ============================================================

describe('updateTaskSchema', () => {
  it('accepts partial update with only title', () => {
    const result = updateTaskSchema.safeParse({ title: 'new title' });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only status', () => {
    const result = updateTaskSchema.safeParse({ status: 'DONE' });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with dueDate', () => {
    const result = updateTaskSchema.safeParse({
      dueDate: '2025-12-31T23:59:59.000Z',
    });
    expect(result.success).toBe(true);
  });

  // 边界：update 也接受 YYYY-MM-DD 日期格式
  it('accepts date-only dueDate in update (YYYY-MM-DD)', () => {
    const result = updateTaskSchema.safeParse({
      dueDate: '2026-06-07',
    });
    expect(result.success).toBe(true);
  });

  // 边界：update 拒绝无效日期
  it('rejects invalid dueDate in update', () => {
    const result = updateTaskSchema.safeParse({
      dueDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects empty title when title is provided', () => {
    const result = updateTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = updateTaskSchema.safeParse({ status: 'COMPLETED' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const result = updateTaskSchema.safeParse({ priority: 'SEVERE' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// taskQuerySchema
// ============================================================

describe('taskQuerySchema', () => {
  it('defaults page to 1 and pageSize to 20', () => {
    const result = taskQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it('coerces string query params to numbers', () => {
    const result = taskQuerySchema.safeParse({ page: '2', pageSize: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(10);
    }
  });

  it('accepts valid status filter', () => {
    for (const status of ['TODO', 'IN_PROGRESS', 'DONE']) {
      const result = taskQuerySchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status filter', () => {
    const result = taskQuerySchema.safeParse({ status: 'OVERDUE' });
    expect(result.success).toBe(false);
  });

  it('rejects pageSize > 100', () => {
    const result = taskQuerySchema.safeParse({ pageSize: '200' });
    expect(result.success).toBe(false);
  });
});
