# AGENTS.md — FlowNote 开发指南

## 1. 项目概述

FlowNote（流知）是一个知识-任务闭环协作平台，将碎片笔记 → 知识页面 → 任务执行打通。核心闭环：

```
笔记捕获 ──→ 知识页面结构化 ──→ 任务板执行
    ↑                              │
    └──────── 互相转换 ──────────────┘
```

**MVP 目标（June 13，2026）：** 用户注册/登录、笔记 CRUD + 转换知识页/任务、知识页 CRUD + Markdown 编辑、任务 CRUD + Kanban 三列看板。

---

## 2. 技术栈

| 层 | 选型 | 版本 |
|---|---|---|
| API 框架 | Hono | 4.x |
| ORM | Drizzle ORM | latest |
| 数据库 | PostgreSQL | 16 |
| 校验 | Zod | 3.x |
| Auth | jose + bcryptjs | latest |
| 前端框架 | Nuxt 3 | 3.x |
| UI | shadcn-vue + Tailwind CSS | latest |
| 编辑器 | Tiptap | latest |
| 图表 | ECharts + vue-echarts | latest |
| 测试 | Vitest | latest |
| 包管理 | pnpm | 9.x |
| 运行时 | Node.js | 22+ |
| 容器 | Docker + Docker Compose | latest |

---

## 3. 项目结构

```
flownote/
├── apps/
│   ├── api/                    # Hono API 服务
│   │   ├── src/
│   │   │   ├── index.ts        # 入口：Hono 实例
│   │   │   ├── app.ts          # 路由组装
│   │   │   ├── lib/            # 工具函数
│   │   │   │   ├── db.ts       # Drizzle 连接
│   │   │   │   └── auth.ts     # JWT 签发/验证
│   │   │   ├── routes/         # 路由模块
│   │   │   │   ├── auth.ts     # /api/v1/auth/*
│   │   │   │   ├── notes.ts    # /api/v1/notes/*
│   │   │   │   ├── pages.ts    # /api/v1/pages/*
│   │   │   │   └── tasks.ts    # /api/v1/tasks/*
│   │   │   └── middleware/     # 中间件
│   │   │       ├── auth.ts     # JWT 验证中间件
│   │   │       └── error.ts    # 全局错误处理
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   └── web/                    # Nuxt 3 前端
│       ├── pages/              # 文件路由
│       │   ├── index.vue       # 首页
│       │   ├── login.vue       # 登录
│       │   ├── register.vue    # 注册
│       │   ├── notes/
│       │   │   ├── index.vue   # 笔记列表
│       │   │   └── [id].vue    # 笔记详情
│       │   ├── pages/
│       │   │   ├── index.vue   # 知识页列表
│       │   │   └── [id].vue    # 知识页详情+编辑
│       │   └── tasks/
│       │       ├── index.vue   # Kanban 看板
│       │       └── [id].vue    # 任务详情
│       ├── components/         # 共享组件
│       │   ├── ui/             # shadcn-vue 组件
│       │   └── ...
│       ├── composables/        # 组合式函数
│       │   ├── useAuth.ts
│       │   ├── useNotes.ts
│       │   ├── usePages.ts
│       │   └── useTasks.ts
│       ├── server/             # Nuxt 服务端（代理到 Hono）
│       │   └── api/            # 可选：简单 BFF 层
│       ├── package.json
│       └── nuxt.config.ts
├── packages/
│   └── shared/                 # 前后端共享
│       ├── src/
│       │   ├── db/             # Drizzle schema
│       │   │   ├── schema.ts   # 表定义
│       │   │   └── relations.ts# 关联定义
│       │   ├── types/          # DTO 类型
│       │   │   ├── user.ts
│       │   │   ├── note.ts
│       │   │   ├── page.ts
│       │   │   └── task.ts
│       │   └── validators/     # Zod schemas
│       │       ├── auth.ts
│       │       ├── note.ts
│       │       ├── page.ts
│       │       └── task.ts
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml          # PostgreSQL
├── pnpm-workspace.yaml
├── package.json                # 根 workspace 脚本
└── .gitignore
```

---

## 4. 开发环境搭建

### 4.1 配置文件

**`.env.example`（复制为 `apps/api/.env`）：**

```bash
DATABASE_URL=postgresql://flownote:flownote@localhost:5432/flownote
# ⚠️ 必须替换为随机密钥，代码拒绝使用占位符
JWT_SECRET=your-secret-key-here
PORT=3000
```

**`pnpm-workspace.yaml`：**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Root `package.json` scripts：**

```json
{
  "scripts": {
    "dev": "concurrently -n api,web -c blue,green \"pnpm --filter @flownote/api dev\" \"pnpm --filter @flownote/web dev\"",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "db:push": "pnpm --filter @flownote/api db:push",
    "db:studio": "pnpm --filter @flownote/api db:studio"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

**`apps/api/drizzle.config.ts`：**

```typescript
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: '../../packages/shared/src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### 4.2 启动步骤

```bash
# 1. 安装依赖（首次需批准构建：pnpm approve-builds 选 esbuild）
pnpm install

# 2. 配置环境变量
cp .env.example apps/api/.env
# 编辑 apps/api/.env，替换 JWT_SECRET

# 3. 启动 PostgreSQL
docker compose up -d

# 4. 初始化数据库（生成表结构）
pnpm db:push

# 5. 启动开发服务
pnpm --filter @flownote/api dev
# API → http://localhost:3000 | Docs → http://localhost:3000/docs
# Web → http://localhost:3001（M3 待开发）
```

单个项目启动：
```bash
pnpm --filter @flownote/api dev     # Hono API → localhost:3000
pnpm --filter @flownote/web dev     # Nuxt 3 → localhost:3001
```

---

## 5. 编码规范

### 文件命名
- 组件文件：`PascalCase.vue`
- 工具函数：`kebab-case.ts`
- 路由文件：`kebab-case.ts`
- 类型文件：`feature.ts`

### TypeScript
- 严格模式（`strict: true`）
- Drizzle 查询结果类型从 schema 推导，不手写
- Zod schema → TypeScript type 用 `z.infer<typeof schema>`

### Git 规范
- 分支名：`feat/<author>/<feature>`, `fix/<author>/<bug>`
- Commit：`<type>: <english-short-description>`
  - `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`

---

## 6. API 路由设计

```
POST   /api/v1/auth/register          # 注册
POST   /api/v1/auth/login             # 登录
GET    /api/v1/auth/profile           # 当前用户（需 JWT）

GET    /api/v1/notes                  # 笔记列表
POST   /api/v1/notes                  # 创建笔记
GET    /api/v1/notes/:id              # 笔记详情
PATCH  /api/v1/notes/:id              # 更新笔记
DELETE /api/v1/notes/:id              # 删除笔记
POST   /api/v1/notes/:id/convert      # 笔记→知识页 或 笔记→任务

GET    /api/v1/pages                  # 知识页列表
POST   /api/v1/pages                  # 创建知识页
GET    /api/v1/pages/:id              # 知识页详情
PATCH  /api/v1/pages/:id              # 更新知识页
DELETE /api/v1/pages/:id              # 删除知识页

GET    /api/v1/tasks                  # 任务列表（支持 ?status=）
POST   /api/v1/tasks                  # 创建任务
GET    /api/v1/tasks/:id              # 任务详情
PATCH  /api/v1/tasks/:id              # 更新任务（含状态变更）
DELETE /api/v1/tasks/:id              # 删除任务
```

所有路由（除 auth register/login）需要 `Authorization: Bearer <token>` 头。

---

## 7. MVP 里程碑计划（June 2 - June 13）

### M1: 环境搭建 + Schema（June 2 晚 - June 3）

**完成标准：** `pnpm dev` 前后端同时启动，Drizzle schema 能生成表，种子数据可写入。

**Hono 骨架关键代码（`apps/api/src/index.ts`）：**

```typescript
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

serve({ fetch: server.fetch, port: 3000 });
console.log('API running on http://localhost:3000');
```

**Task list：**
- [ ] 初始化 pnpm monorepo（`pnpm-workspace.yaml`, root `package.json`）
- [ ] 创建 `apps/api`：Hono 骨架 + `@hono/node-server` + TypeScript
- [ ] 创建 `apps/web`：Nuxt 3 + shadcn-vue + Tailwind 骨架
- [ ] 创建 `packages/shared`：Drizzle schema + Zod validators
- [ ] `docker-compose.yml`：PostgreSQL 16
- [ ] Drizzle 迁移：`db:push` 生成表结构
- [ ] API `/health` 端点 + Web 首页返回 200

---

### M2: 后端 API（June 3 - June 6）

**完成标准：** 所有 API 端点可通过 `curl` 调用，返回正确 JSON，JWT 鉴权生效。

**Task list：**
- [ ] `POST /api/v1/auth/register` + `login` — jose 签发 JWT + bcryptjs 加密
- [ ] `middleware/auth.ts` — JWT 验证中间件
- [ ] `middleware/error.ts` — 全局错误处理（ZodError → 400, 通用 → 500）
- [ ] `GET/POST/PATCH/DELETE /api/v1/notes` — 笔记 CRUD（按 userId 隔离）
- [ ] `POST /api/v1/notes/:id/convert` — 笔记转知识页/任务
- [ ] `GET/POST/PATCH/DELETE /api/v1/pages` — 知识页 CRUD
- [ ] `GET/POST/PATCH/DELETE /api/v1/tasks` — 任务 CRUD + 状态变更
- [ ] `GET /api/v1/auth/profile` — 当前用户信息
- [ ] API 文档：`@scalar/hono-api-reference` 挂载到 `/docs`
- [ ] Vitest：auth/notes/pages/tasks 核心路由测试

---

### M3: 前端页面（June 6 - June 11）

**完成标准：** 所有页面可通过浏览器操作，完成闭环流程。

**Task list：**
- [ ] 注册/登录页面 + 登录态持久化（composable `useAuth`）
- [ ] 笔记列表页：时间线展示 + 创建/编辑/删除
- [ ] 笔记详情页：Markdown 编辑（Tiptap）+ 预览 + 转换按钮
- [ ] 知识页列表页：卡片网格 + 创建/编辑/删除
- [ ] 知识页详情页：Tiptap 编辑器 + 元数据展示
- [ ] 任务 Kanban 看板：三列拖拽（TODO/IN_PROGRESS/DONE）
- [ ] 任务详情页：标题/描述/优先级/截止日编辑
- [ ] 导航栏：页面间导航 + 用户信息 + 登出
- [ ] UI 完善：loading 状态、空状态、错误提示

---

### M4: 集成 + 测试 + 交付（June 11 - June 13）

**完成标准：** Docker 一键部署，用户可完成核心流程，试用反馈报告。

**Task list：**
- [ ] Dockerfile for API（多阶段构建）
- [ ] Dockerfile for Web（Nuxt SSR/static）
- [ ] Docker Compose：API + Web + PG 一键启动
- [ ] Vitest 集成测试：核心闭环（注册→创建笔记→转知识页→转任务→状态变更）
- [ ] 用户试用脚本 + 问卷
- [ ] 试用反馈报告（>3 人）
- [ ] 交付文档更新（README 部署指南）
- [ ] 最终 Demo 视频/截图

---

## 8. 测试策略

```
apps/api/src/**/__tests__/**/*.test.ts   # API 单元/集成测试（Vitest）
apps/web/**/*.test.ts                    # 前端组件测试（Vitest + @vue/test-utils）
```

**运行测试：** `pnpm --filter @flownote/api test`（当前 122 个单元测试）

**每个路由最少 2 个测试：** 正常路径 + 鉴权失败 401。

---

## 9. 交付清单

- [ ] `docker compose up` 一键启动
- [ ] 可在浏览器完成：注册→写笔记→转知识页→转任务→Kanban 拖动
- [ ] >3 人用户试用 + 反馈报告
- [ ] API 文档 `/docs` 可访问
- [ ] 所有 API 测试通过
