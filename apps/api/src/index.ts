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

// 启动时校验必需的环境变量
function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (process.env.JWT_SECRET === 'change-me-in-production') {
    console.error('❌ JWT_SECRET must be changed from the default value "change-me-in-production"');
    process.exit(1);
  }
}
validateEnv();

// FIX 13: 使用 nullish coalescing 而非 logical OR，保留 PORT=0 的语义
const port = Number(process.env.PORT) ?? 3000;

serve({ fetch: server.fetch, port });

console.log(`🚀 FlowNote API running on http://localhost:${port}`);
console.log(`📖 API Docs: http://localhost:${port}/docs`);
