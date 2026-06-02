import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { app } from './app';
import { resolvePort } from './lib/env';

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
  // 拒绝 .env.example 中的示例值，防止遗忘配置
  const bannedSecrets = ['change-me-in-production', 'your-secret-key-here'];
  if (bannedSecrets.includes(process.env.JWT_SECRET!)) {
    console.error(`❌ JWT_SECRET must be changed from the placeholder value "${process.env.JWT_SECRET}"`);
    process.exit(1);
  }
}
validateEnv();

const port = resolvePort(process.env.PORT);

serve({ fetch: server.fetch, port });

console.log(`🚀 FlowNote API running on http://localhost:${port}`);
console.log(`📖 API Docs: http://localhost:${port}/docs`);
