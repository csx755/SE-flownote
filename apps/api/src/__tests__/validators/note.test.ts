import { describe, expect, it } from 'vitest';
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
  convertNoteSchema,
} from '@flownote/shared';

// ============================================================
// createNoteSchema
// ============================================================

describe('createNoteSchema', () => {
  it('accepts valid input with content', () => {
    const result = createNoteSchema.safeParse({ content: 'Hello world' });
    expect(result.success).toBe(true);
  });

  it('defaults contentType to TEXT', () => {
    const result = createNoteSchema.safeParse({ content: 'Hello' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contentType).toBe('TEXT');
    }
  });

  it('accepts explicit MARKDOWN content type', () => {
    const result = createNoteSchema.safeParse({
      content: '# Heading',
      contentType: 'MARKDOWN',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contentType).toBe('MARKDOWN');
    }
  });

  it('rejects empty content', () => {
    const result = createNoteSchema.safeParse({ content: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('内容不能为空');
    }
  });

  it('rejects invalid contentType', () => {
    const result = createNoteSchema.safeParse({
      content: 'test',
      contentType: 'HTML',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// updateNoteSchema
// ============================================================

describe('updateNoteSchema', () => {
  it('accepts partial update with only content', () => {
    const result = updateNoteSchema.safeParse({ content: 'updated' });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only isArchived', () => {
    const result = updateNoteSchema.safeParse({ isArchived: true });
    expect(result.success).toBe(true);
  });

  it('accepts multiple fields', () => {
    const result = updateNoteSchema.safeParse({
      content: 'updated',
      isArchived: false,
      contentType: 'MARKDOWN',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    // An empty object is valid because all fields are optional
    const result = updateNoteSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects empty content when content is provided', () => {
    const result = updateNoteSchema.safeParse({ content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid contentType', () => {
    const result = updateNoteSchema.safeParse({ contentType: 'PDF' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// noteQuerySchema — z.coerce + transform
// ============================================================

describe('noteQuerySchema', () => {
  it('defaults page to 1 and pageSize to 20', () => {
    const result = noteQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it('coerces string page and pageSize to numbers', () => {
    const result = noteQuerySchema.safeParse({ page: '3', pageSize: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.pageSize).toBe(50);
    }
  });

  it('rejects page < 1', () => {
    const result = noteQuerySchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects pageSize > 100', () => {
    const result = noteQuerySchema.safeParse({ pageSize: '101' });
    expect(result.success).toBe(false);
  });

  it('accepts pageSize exactly at 100 (boundary)', () => {
    const result = noteQuerySchema.safeParse({ pageSize: '100' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pageSize).toBe(100);
    }
  });

  it('rejects pageSize < 1', () => {
    const result = noteQuerySchema.safeParse({ pageSize: '0' });
    expect(result.success).toBe(false);
  });

  it('transforms archived=true to boolean true', () => {
    const result = noteQuerySchema.safeParse({ archived: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.archived).toBe(true);
    }
  });

  it('transforms archived=false to boolean false', () => {
    const result = noteQuerySchema.safeParse({ archived: 'false' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.archived).toBe(false);
    }
  });

  it('rejects invalid archived value', () => {
    const result = noteQuerySchema.safeParse({ archived: 'yes' });
    expect(result.success).toBe(false);
  });

  it('accepts startDate and endDate strings', () => {
    const result = noteQuerySchema.safeParse({
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// convertNoteSchema
// ============================================================

describe('convertNoteSchema', () => {
  it('accepts KNOWLEDGE_PAGE target with title', () => {
    const result = convertNoteSchema.safeParse({
      targetType: 'KNOWLEDGE_PAGE',
      title: 'My Page',
    });
    expect(result.success).toBe(true);
  });

  it('accepts TASK target with title', () => {
    const result = convertNoteSchema.safeParse({
      targetType: 'TASK',
      title: 'Buy milk',
    });
    expect(result.success).toBe(true);
  });

  it('accepts targetType without title (title is optional)', () => {
    const result = convertNoteSchema.safeParse({ targetType: 'TASK' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid targetType', () => {
    const result = convertNoteSchema.safeParse({
      targetType: 'CALENDAR_EVENT',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty targetType', () => {
    const result = convertNoteSchema.safeParse({ targetType: '' });
    expect(result.success).toBe(false);
  });
});
