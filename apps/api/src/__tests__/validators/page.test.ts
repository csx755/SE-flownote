import { describe, expect, it } from 'vitest';
import {
  createPageSchema,
  updatePageSchema,
  pageQuerySchema,
} from '@flownote/shared';

// ============================================================
// createPageSchema
// ============================================================

describe('createPageSchema', () => {
  it('accepts valid input with title', () => {
    const result = createPageSchema.safeParse({ title: 'My Knowledge Page' });
    expect(result.success).toBe(true);
  });

  it('defaults content to empty string', () => {
    const result = createPageSchema.safeParse({ title: 'Page' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('');
    }
  });

  it('accepts explicit content', () => {
    const result = createPageSchema.safeParse({
      title: 'Guide',
      content: '# Markdown content',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('# Markdown content');
    }
  });

  it('rejects empty title', () => {
    const result = createPageSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('标题不能为空');
    }
  });

  it('rejects title longer than 255 characters', () => {
    const result = createPageSchema.safeParse({ title: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('accepts title exactly at 255 characters (boundary)', () => {
    const result = createPageSchema.safeParse({ title: 'a'.repeat(255) });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = createPageSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ============================================================
// updatePageSchema
// ============================================================

describe('updatePageSchema', () => {
  it('accepts partial update with only title', () => {
    const result = updatePageSchema.safeParse({ title: 'Updated Title' });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only content', () => {
    const result = updatePageSchema.safeParse({ content: 'New content' });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only isArchived', () => {
    const result = updatePageSchema.safeParse({ isArchived: true });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = updatePageSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects empty title when title is provided', () => {
    const result = updatePageSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title > 255 when title is provided', () => {
    const result = updatePageSchema.safeParse({ title: 'x'.repeat(256) });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// pageQuerySchema
// ============================================================

describe('pageQuerySchema', () => {
  it('defaults page to 1 and pageSize to 20', () => {
    const result = pageQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it('coerces string params to numbers', () => {
    const result = pageQuerySchema.safeParse({ page: '5', pageSize: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(5);
      expect(result.data.pageSize).toBe(50);
    }
  });

  it('rejects page < 1', () => {
    const result = pageQuerySchema.safeParse({ page: '-1' });
    expect(result.success).toBe(false);
  });

  it('rejects pageSize > 100', () => {
    const result = pageQuerySchema.safeParse({ pageSize: '999' });
    expect(result.success).toBe(false);
  });

  it('accepts pageSize exactly at 100 (boundary)', () => {
    const result = pageQuerySchema.safeParse({ pageSize: '100' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pageSize).toBe(100);
    }
  });

  it('rejects non-numeric page', () => {
    const result = pageQuerySchema.safeParse({ page: 'abc' });
    expect(result.success).toBe(false);
  });
});
