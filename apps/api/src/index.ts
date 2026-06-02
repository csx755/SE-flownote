import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { app } from './app';

const server = new Hono();

// CORS: 允许 Nuxt dev server 跨域
server.use('*', cors({
  origin: ['http://localhost:3001'],
  credentials: true,
}));

server.route('/', app);

const port = Number(process.env.PORT) || 3000;

serve({ fetch: server.fetch, port });

console.log(`🚀 FlowNote API running on http://localhost:${port}`);
console.log(`📖 API Docs: http://localhost:${port}/docs`);
