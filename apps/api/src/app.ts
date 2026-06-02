import { Hono } from 'hono';
import { apiReference } from '@scalar/hono-api-reference';
import { errorHandler, nonErrorCatcher } from './middleware/error';
import auth from './routes/auth';
import notesRoute from './routes/notes';
import pagesRoute from './routes/pages';
import tasksRoute from './routes/tasks';

const app = new Hono();

// 捕获非 Error 的 throw（Hono 会重新抛出它们）
app.use('*', nonErrorCatcher);
// 全局错误处理 — 必须用 onError 而非中间件
// Hono 内部 compose 会拦截 Error 实例，中间件的 try/catch 看不到它们
app.onError(errorHandler);

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API 路由
app.route('/api/v1/auth', auth);
app.route('/api/v1/notes', notesRoute);
app.route('/api/v1/pages', pagesRoute);
app.route('/api/v1/tasks', tasksRoute);

// Scalar API 文档
app.get(
  '/docs',
  apiReference({
    pageTitle: 'FlowNote API',
    spec: {
      url: '/openapi.json',
    },
  })
);

// OpenAPI 规范（内联定义，无需额外依赖）
app.get('/openapi.json', (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'FlowNote API',
      version: '0.1.0',
      description: '流知·FlowNote — 一体化知识与任务协作平台 API',
    },
    servers: [{ url: 'http://localhost:3000' }],
    paths: {
      '/api/v1/auth/register': {
        post: { summary: '用户注册', tags: ['Auth'] },
      },
      '/api/v1/auth/login': {
        post: { summary: '用户登录', tags: ['Auth'] },
      },
      '/api/v1/auth/profile': {
        get: { summary: '获取当前用户', tags: ['Auth'] },
      },
      '/api/v1/notes': {
        get: { summary: '便签列表', tags: ['Notes'] },
        post: { summary: '创建便签', tags: ['Notes'] },
      },
      '/api/v1/notes/{id}': {
        get: { summary: '便签详情', tags: ['Notes'] },
        patch: { summary: '更新便签', tags: ['Notes'] },
        delete: { summary: '删除便签', tags: ['Notes'] },
      },
      '/api/v1/notes/{id}/convert': {
        post: { summary: '便签转换', tags: ['Notes'] },
      },
      '/api/v1/pages': {
        get: { summary: '知识页列表', tags: ['Pages'] },
        post: { summary: '创建知识页', tags: ['Pages'] },
      },
      '/api/v1/pages/{id}': {
        get: { summary: '知识页详情', tags: ['Pages'] },
        patch: { summary: '更新知识页', tags: ['Pages'] },
        delete: { summary: '删除知识页', tags: ['Pages'] },
      },
      '/api/v1/tasks': {
        get: { summary: '任务列表', tags: ['Tasks'] },
        post: { summary: '创建任务', tags: ['Tasks'] },
      },
      '/api/v1/tasks/{id}': {
        get: { summary: '任务详情', tags: ['Tasks'] },
        patch: { summary: '更新任务', tags: ['Tasks'] },
        delete: { summary: '删除任务', tags: ['Tasks'] },
      },
    },
  });
});

export { app };
