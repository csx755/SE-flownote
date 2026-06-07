import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { app } from '../../app';

// 集成测试 — 覆盖所有端点 + 边界/极端情况
// 依赖: docker compose up -d postgres

function createServer() {
  const server = new Hono();
  server.route('/', app);
  return server;
}

const suffix = Date.now();
const testUser = {
  username: `integ_${suffix}`,
  email: `integ_${suffix}@test.com`,
  password: 'Integration123',
};
let token = '';
// IDs shared across test cases
let noteId: number;
let pageId: number;
let taskId: number;

describe('Auth', () => {
  // ── Register ────────────────────────────────────────

  it('注册成功 → 201 + token + user', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user.username).toBe(testUser.username);
    expect(body.user.email).toBe(testUser.email);
    expect(body.user.id).toBeGreaterThan(0);
    token = body.token;
  });

  it('重复邮箱注册 → 409', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('邮箱');
  });

  it('注册非法输入（username 过短） → 400', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ab', email: 'bad@test.com', password: 'Pass1234' }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation Error');
  });

  // ── Login ────────────────────────────────────────────

  it('登录成功 → 200 + token', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    token = body.token; // update token with fresh one
  });

  it('错误密码 → 401', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'WrongPass1' }),
    });

    expect(res.status).toBe(401);
  });

  // ── Profile ──────────────────────────────────────────

  it('个人信息 → 200 + user 完整字段', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.username).toBe(testUser.username);
    expect(body.email).toBe(testUser.email);
  });
});

describe('Notes', () => {
  // ── Create ───────────────────────────────────────────

  it('创建笔记 → 201', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: '# Test Note', contentType: 'MARKDOWN' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeGreaterThan(0);
    expect(body.content).toBe('# Test Note');
    expect(body.contentType).toBe('MARKDOWN');
    noteId = body.id;
  });

  it('创建笔记空内容 → 400', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: '' }),
    });

    expect(res.status).toBe(400);
  });

  it('创建笔记默认 contentType 为 TEXT', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: 'Minimal' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.contentType).toBe('TEXT');
  });

  // ── List ─────────────────────────────────────────────

  it('笔记列表 → 200 + 数组', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/notes', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
  });

  it('笔记列表 archived 过滤', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/notes?archived=false', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    body.forEach((n: { isArchived: boolean }) => {
      expect(n.isArchived).toBe(false);
    });
  });

  // ── Get by ID ────────────────────────────────────────

  it('获取笔记详情 → 200', async () => {
    const server = createServer();
    const res = await server.request(`/api/v1/notes/${noteId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(noteId);
  });

  it('获取不存在的笔记 → 404', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/notes/99999', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
  });

  // ── Update ───────────────────────────────────────────

  it('更新笔记 → 200', async () => {
    const server = createServer();
    const res = await server.request(`/api/v1/notes/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: '# Updated', isArchived: false }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content).toBe('# Updated');
    // 验证 updatedAt 被后端显式更新
    expect(body.updatedAt).toBeDefined();
    expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(Date.now() - 10_000);
  });

  it('更新不存在的笔记 → 404', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/notes/99999', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: 'Nope' }),
    });

    expect(res.status).toBe(404);
  });
});

describe('Convert', () => {
  it('笔记转为知识页 → 201', async () => {
    const server = createServer();
    const res = await server.request(`/api/v1/notes/${noteId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetType: 'KNOWLEDGE_PAGE', title: 'Knowledge from Note' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.targetType).toBe('KNOWLEDGE_PAGE');
    expect(body.target.id).toBeGreaterThan(0);
    pageId = body.target.id;
  });

  it('同一笔记可同时转为知识页和任务 → 201', async () => {
    // 新建笔记用于测试多次转换
    const server = createServer();
    const createRes = await server.request('/api/v1/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: 'Multi-convert note' }),
    });
    const { id: multiNoteId } = await createRes.json();

    // 先转为知识页
    const res1 = await server.request(`/api/v1/notes/${multiNoteId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetType: 'KNOWLEDGE_PAGE', title: 'Page from multi' }),
    });
    expect(res1.status).toBe(201);

    // 再转为任务
    const res2 = await server.request(`/api/v1/notes/${multiNoteId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetType: 'TASK', title: 'Task from multi' }),
    });
    expect(res2.status).toBe(201);
    const body = await res2.json();
    expect(body.targetType).toBe('TASK');
  });

  it('另一笔记转为任务 → 201', async () => {
    // 新建笔记用于转为任务
    const server = createServer();
    const createRes = await server.request('/api/v1/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: 'Convert me to task' }),
    });
    const { id: newNoteId } = await createRes.json();

    const res = await server.request(`/api/v1/notes/${newNoteId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetType: 'TASK', title: 'Task from Note' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.targetType).toBe('TASK');
  });
});

describe('Pages', () => {
  // ── Create ───────────────────────────────────────────

  it('创建知识页 → 201', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: 'Standalone Page', content: '# Hello' }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeGreaterThan(0);
    expect(body.title).toBe('Standalone Page');
  });

  it('创建知识页缺标题 → 400', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  // ── Get ──────────────────────────────────────────────

  it('获取知识页详情 → 200', async () => {
    const server = createServer();
    const res = await server.request(`/api/v1/pages/${pageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(pageId);
  });

  it('获取不存在的知识页 → 404', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/pages/99999', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
  });

  // ── Update ───────────────────────────────────────────

  it('更新知识页 → 200', async () => {
    const server = createServer();
    const res = await server.request(`/api/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: 'Updated Page Title' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Updated Page Title');
    // 验证 updatedAt 被后端显式更新
    expect(body.updatedAt).toBeDefined();
    expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(Date.now() - 10_000);
  });

  // ── Delete ───────────────────────────────────────────

  it('删除知识页 → 200', async () => {
    const server = createServer();
    const createRes = await server.request('/api/v1/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: 'To Delete' }),
    });
    const { id: delId } = await createRes.json();

    const res = await server.request(`/api/v1/pages/${delId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
  });

  it('删除不存在的知识页 → 404', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/pages/99999', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
  });
});

describe('Tasks', () => {
  // ── Create ───────────────────────────────────────────

  it('创建任务 → 201', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Integration Task',
        priority: 'HIGH',
        dueDate: '2026-12-31T23:59:59.000Z',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeGreaterThan(0);
    expect(body.title).toBe('Integration Task');
    expect(body.priority).toBe('HIGH');
    taskId = body.id;
  });

  it('创建任务缺标题 → 400', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });

  it('创建任务非法 priority → 400', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: 'Bad', priority: 'CRITICAL' }),
    });

    expect(res.status).toBe(400);
  });

  // ── List ─────────────────────────────────────────────

  it('任务列表 → 200 + 数组', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/tasks', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('任务列表 status 过滤', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/tasks?status=TODO', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    body.forEach((t: { status: string }) => {
      expect(t.status).toBe('TODO');
    });
  });

  // ── Get ──────────────────────────────────────────────

  it('获取任务详情 → 200', async () => {
    const server = createServer();
    const res = await server.request(`/api/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(taskId);
    expect(body.priority).toBe('HIGH');
  });

  it('获取不存在的任务 → 404', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/tasks/99999', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
  });

  // ── Update ───────────────────────────────────────────

  it('更新任务状态 TODO→DONE → 200', async () => {
    const server = createServer();
    const res = await server.request(`/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'DONE' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('DONE');
  });

  it('更新任务非法 status → 400', async () => {
    const server = createServer();
    const res = await server.request(`/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });

    expect(res.status).toBe(400);
  });

  // ── Delete ───────────────────────────────────────────

  it('删除任务 → 200', async () => {
    const server = createServer();
    const createRes = await server.request('/api/v1/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: 'To Delete' }),
    });
    const { id: delId } = await createRes.json();

    const res = await server.request(`/api/v1/tasks/${delId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
  });

  it('删除不存在的任务 → 404', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/tasks/99999', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(404);
  });
});

describe('Guards & Edges', () => {
  it('NaN ID → 400', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/notes/abc', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
  });

  it('空 PATCH body → 400', async () => {
    const server = createServer();
    const res = await server.request(`/api/v1/notes/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('未认证请求 → 401', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/notes');
    expect(res.status).toBe(401);
  });

  it('无 token 访问受保护端点 → 401', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/tasks');
    expect(res.status).toBe(401);
  });

  it('畸形 JSON 请求体 → 400', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{broken json',
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('JSON');
  });

  it('删除不存在的笔记 → 404', async () => {
    const server = createServer();
    const res = await server.request('/api/v1/notes/99999', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });
});

function createCorsServer() {
  const server = new Hono();
  server.use('*', cors({ origin: ['http://localhost:3001'], credentials: true }));
  server.route('/', app);
  return server;
}

describe('CORS & Workspace', () => {
  it('API 返回 CORS 头允许前端 localhost:3001', async () => {
    const server = createCorsServer();
    const res = await server.request('/health', {
      headers: { Origin: 'http://localhost:3001' },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3001');
  });

  it('CORS 预检请求 (OPTIONS) 返回正确头部', async () => {
    const server = createCorsServer();
    const res = await server.request('/api/v1/auth/login', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3001',
        'Access-Control-Request-Method': 'POST',
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3001');
  });

  it('健康检查公网可达（无需认证）', async () => {
    const server = createServer();
    const res = await server.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});