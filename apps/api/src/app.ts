import { Hono } from 'hono';
import { errorHandler } from './middleware/error';
import auth from './routes/auth';
import notesRoute from './routes/notes';
import pagesRoute from './routes/pages';
import tasksRoute from './routes/tasks';

const app = new Hono();

// 全局错误处理
app.use('*', errorHandler);

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API 路由
app.route('/api/v1/auth', auth);
app.route('/api/v1/notes', notesRoute);
app.route('/api/v1/pages', pagesRoute);
app.route('/api/v1/tasks', tasksRoute);

export { app };
