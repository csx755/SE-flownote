# 流知 · FlowNote MVP 项目说明

> 小组编号：2024LJSE03 | 武汉大学计算机学院 软件工程课程项目

---

## 一、项目背景与目标

### 1.1 问题背景

在学习、项目协作和个人事务处理中，人们经常产生零散想法、资料摘录和待办事项。现有工具往往将"记录""整理""执行"割裂在不同应用中——便签只管记、文档只管写、待办只管勾，信息在工具间流转时容易散落、丢失、断裂。

### 1.2 核心理念

FlowNote 将碎片信息捕获、知识结构化、任务执行串联为一条完整链路：

```
碎片便签捕获 → 知识页面结构化 → 任务看板执行
```

用户可以快速记录一条便签，将其一键转化为知识页面进行 Markdown 结构化整理，或一键转化为任务在看板上推进执行状态，实现从"想法"到"行动"的闭环。

### 1.3 MVP 目标

MVP 版本聚焦验证以下核心假设：用户在日常场景中会产生零散想法和待办，FlowNote 能让他们快速记录、整理、执行，从而降低"信息散落、无法沉淀、行动断裂"的痛点。

---

## 二、系统功能说明

### 2.1 用户认证

- 支持用户注册与登录，基于 JWT 鉴权
- 不同用户数据完全隔离，未登录不可访问任何功能页面
- 密码使用 bcryptjs 加密存储

### 2.2 便签模块

便签是 FlowNote 的信息捕获入口，用于快速记录碎片想法。

**功能列表：**

| 功能 | 说明 |
|------|------|
| 创建便签 | 顶部文本框输入内容，Ctrl+Enter 快捷提交，30 秒内完成一条记录 |
| 编辑便签 | 点击便签进入编辑模式，支持原地编辑和保存 |
| 归档 / 恢复 | 将不再需要关注的便签归档，支持恢复 |
| 删除 | 确认后删除便签 |
| 时间线展示 | 按创建时间倒序排列，自动分为"今天""昨天""更早"三组 |
| 标签管理 | 为便签添加/移除自定义标签，支持搜索和新建标签 |

### 2.3 知识页面模块

知识页面用于将碎片内容整理为结构化材料。

**功能列表：**

| 功能 | 说明 |
|------|------|
| 创建页面 | 输入标题即可创建，进入编辑器后补充内容 |
| Markdown 编辑 | 左右分栏：左侧编辑源码，右侧实时预览渲染效果 |
| 支持格式 | 标题（h1-h6）、有序/无序列表、**加粗**、*斜体*、`行内代码`、代码块、链接等 |
| 保存 | 手动保存，底部显示创建时间和最后更新时间 |
| 删除 | 确认后删除页面 |
| 反向链接 | 页面底部自动展示引用了当前页面的其他页面列表 |
| 标签管理 | 为页面添加/移除自定义标签 |

### 2.4 任务看板模块

任务看板用于将信息转化为可执行行动并跟踪执行状态。

**功能列表：**

| 功能 | 说明 |
|------|------|
| 创建任务 | 支持设置标题、描述、优先级（低/中/高/紧急）、截止日期 |
| 三列看板 | 待办（TODO）、进行中（IN_PROGRESS）、已完成（DONE）三列展示 |
| 状态流转 | 待办→开始→进行中→完成→已完成，支持回退和重开 |
| 优先级标识 | 四级优先级以不同颜色标签区分（灰/黄/橙/红） |
| 截止日期 | 显示剩余天数，逾期任务红色高亮警告 |
| 筛选排序 | 按优先级筛选，按创建时间/截止日期/优先级排序，支持升降序切换 |
| 统计面板 | 顶部展示总计、待办、进行中、已完成、逾期五项统计数据 |
| 标签管理 | 为任务添加/移除自定义标签 |

### 2.5 便签转换

便签转换是 FlowNote 的核心差异化功能，打通"记录→整理→执行"的链路。

| 转换类型 | 说明 |
|----------|------|
| 便签 → 知识页面 | 一键将便签内容转为知识页面，自动取便签前 20 字作为标题，内容完整保留 |
| 便签 → 任务 | 一键将便签内容转为任务，自动取便签前 30 字作为标题，内容作为任务描述 |

转换后原便签标记为"已合并"，保留来源追溯信息。

### 2.6 全局搜索

在导航栏提供全局搜索框，支持跨模块关键词搜索：

- 搜索范围：便签内容、知识页面标题和内容、任务标题和描述
- 结果展示：显示类型图标（📝便签/📄页面/✅任务）、标题、内容片段
- 交互：防抖输入（300ms），点击结果直接跳转到对应页面

### 2.7 标签系统

标签为便签、知识页面、任务提供统一的分类能力：

- 创建标签：输入名称即可新建，同用户下不允许重名
- 关联标签：为任意实体（便签/页面/任务）添加或移除标签
- 标签展示：已选标签以绿色胶囊样式展示，支持一键移除
- 搜索新建：输入框支持搜索已有标签，不存在时可按回车新建

---

## 三、技术架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────┐
│                  前端 (Web)                   │
│   Nuxt 3 + TypeScript + shadcn-vue + Tailwind │
│              http://localhost:3001             │
└──────────────────┬──────────────────────────┘
                   │ HTTP API
┌──────────────────▼──────────────────────────┐
│                 后端 (API)                    │
│        Hono + TypeScript + Drizzle ORM       │
│              http://localhost:3000             │
│         Scalar API 文档: /docs                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              数据库 (PostgreSQL)              │
│           Docker: postgres:16-alpine          │
│              localhost:5432                   │
└─────────────────────────────────────────────┘
```

### 3.2 技术栈

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 前端框架 | Nuxt 3 | Vue 3 生态、SSG/SSR 支持、文件路由 |
| UI 组件 | shadcn-vue + Tailwind CSS | 高质量可定制组件、原子化 CSS |
| 后端框架 | Hono | 轻量高性能、Web 标准 API、中间件机制完善 |
| ORM | Drizzle ORM | 类型安全、SQL-like API、轻量 |
| 数据库 | PostgreSQL 16 | 成熟稳定、JSON 支持、全文检索能力 |
| 数据校验 | Zod | 前后端共享 schema、类型推导 |
| 认证 | jose + bcryptjs | JWT 标准、密码哈希 |
| 测试 | Vitest | Vite 原生、速度快、兼容 Jest API |
| 包管理 | pnpm (monorepo) | workspace 协议、高效依赖管理 |
| 容器化 | Docker + Docker Compose | 一键部署、环境一致性 |

### 3.3 项目结构

```
flownote/
├── apps/
│   ├── api/                    # 后端 API 服务
│   │   ├── src/
│   │   │   ├── routes/         # 路由：auth, notes, pages, tasks, tags, search
│   │   │   ├── middleware/     # 中间件：JWT 鉴权、错误处理
│   │   │   ├── lib/            # 工具库：数据库连接、认证、反向链接
│   │   │   ├── __tests__/      # 测试：集成测试、单元测试
│   │   │   ├── app.ts          # 应用入口、路由注册、OpenAPI 文档
│   │   │   └── index.ts        # 服务启动
│   │   └── Dockerfile
│   └── web/                    # 前端 Nuxt 3 应用
│       ├── pages/              # 页面：index, login, register, notes, pages, tasks
│       ├── components/         # 组件：AppNav, MarkdownEditor, MarkdownPreview,
│       │                       #        SearchBar, TagPicker
│       ├── composables/        # 组合式函数：useAuth, useNotes, usePages,
│       │                       #            useTasks, useTags, useSearch
│       └── utils/              # 工具：markdown 渲染
├── packages/
│   └── shared/                 # 共享层
│       └── src/
│           ├── db/
│           │   ├── schema.ts   # Drizzle 数据模型定义
│           │   └── relations.ts# 表关系定义
│           ├── types/          # TypeScript 类型定义
│           └── validators/     # Zod 校验 schema
├── docs/                       # 课程文档
├── docker-compose.yml          # PostgreSQL + API 容器编排
└── pnpm-workspace.yaml         # Monorepo 工作区配置
```

### 3.4 数据模型

**核心实体关系：**

```
User (1) ──→ (N) Note
User (1) ──→ (N) KnowledgePage
User (1) ──→ (N) Task
User (1) ──→ (N) Tag
Note (N) ←──→ (N) Tag        [通过 note_tags]
KnowledgePage (N) ←──→ (N) Tag [通过 page_tags]
Task (N) ←──→ (N) Tag        [通过 task_tags]
Note ──→ KnowledgePage / Task  [通过 merged_to_id 转换追溯]
```

**主要字段：**

| 实体 | 关键字段 |
|------|----------|
| User | id, username, email, password(bcrypt), avatar, createdAt |
| Note | id, content, contentType(TEXT/MARKDOWN), isArchived, isMerged, mergedToId, userId |
| KnowledgePage | id, title, content(Markdown), isArchived, userId |
| Task | id, title, description, status(TODO/IN_PROGRESS/DONE), priority(LOW/MEDIUM/HIGH/URGENT), dueDate, sourceType, sourceId, userId |
| Tag | id, name, userId |

### 3.5 API 设计

所有接口统一前缀 `/api/v1`，需认证接口通过 JWT Bearer Token 鉴权。

| 模块 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 认证 | /auth/register | POST | 用户注册 |
| | /auth/login | POST | 用户登录 |
| | /auth/profile | GET | 获取当前用户信息 |
| 便签 | /notes | GET | 便签列表（支持分页、归档筛选、日期范围） |
| | /notes | POST | 创建便签 |
| | /notes/:id | GET | 便签详情 |
| | /notes/:id | PATCH | 更新便签 |
| | /notes/:id | DELETE | 删除便签 |
| | /notes/:id/convert | POST | 便签转知识页面/任务 |
| 知识页面 | /pages | GET | 页面列表 |
| | /pages | POST | 创建页面 |
| | /pages/:id | GET | 页面详情 |
| | /pages/:id | PATCH | 更新页面 |
| | /pages/:id | DELETE | 删除页面 |
| | /pages/:id/backlinks | GET | 获取反向链接 |
| 任务 | /tasks | GET | 任务列表（支持筛选、排序） |
| | /tasks | POST | 创建任务 |
| | /tasks/stats | GET | 任务统计数据 |
| | /tasks/:id | GET | 任务详情 |
| | /tasks/:id | PATCH | 更新任务（含状态流转） |
| | /tasks/:id | DELETE | 删除任务 |
| 标签 | /tags | GET | 标签列表 |
| | /tags | POST | 创建标签 |
| | /tags/link | POST | 给实体添加标签 |
| | /tags/link | DELETE | 移除实体标签 |
| | /tags/entity/:type/:id | GET | 获取实体的标签 |
| | /tags/:id | PATCH | 重命名标签 |
| | /tags/:id | DELETE | 删除标签 |
| 搜索 | /search?q=&type= | GET | 全局关键词搜索 |

### 3.6 关键设计决策

1. **便签转换使用数据库事务**：`/notes/:id/convert` 接口在单个事务中完成"查询原便签→创建目标实体→标记原便签为已合并"，防止 TOCTOU 竞态和孤儿数据。

2. **纵深层次鉴权**：所有写操作（UPDATE/DELETE）的 WHERE 条件同时包含 `id` 和 `userId`，即使绕过中间件也无法操作他人数据。

3. **任务看板通过 status 枚举实现**：不引入独立的 Board/BoardColumn 表，通过 Task.status 的三值枚举（TODO/IN_PROGRESS/DONE）实现看板视图，降低 MVP 复杂度。

4. **反向链接通过内容解析**：页面保存时解析 Markdown 中的链接引用，实时计算哪些页面引用了当前页面，无需维护独立的链接关系表。

---

## 四、部署与运行

### 4.1 环境要求

- Node.js 22+
- pnpm 9+
- Docker Desktop（需运行中）

### 4.2 本地开发启动

```bash
# 1. 安装依赖
pnpm install
pnpm approve-builds    # 选择 esbuild 并按回车

# 2. 配置环境变量
cp .env.example apps/api/.env
# 编辑 apps/api/.env，将 JWT_SECRET 改为随机值

# 3. 启动 PostgreSQL
docker compose up -d postgres

# 4. 初始化数据库
pnpm db:push

# 5. 启动开发服务（API + Web）
pnpm dev
# API → http://localhost:3000
# Web → http://localhost:3001
```

### 4.3 Docker Compose 部署

```bash
# 一键启动 PostgreSQL + API
docker compose up -d

# 初始化数据库
pnpm db:push

# 启动前端（本地）
pnpm --filter @flownote/web dev
```

### 4.4 验证

- API 健康检查：`curl http://localhost:3000/health` → `{"status":"ok"}`
- API 文档：浏览器打开 http://localhost:3000/docs
- 前端页面：浏览器打开 http://localhost:3001

### 4.5 运行测试

```bash
pnpm --filter @flownote/api test
```

测试覆盖范围：

| 测试类型 | 覆盖内容 |
|----------|----------|
| 集成测试 | 注册/登录、便签 CRUD、便签转换、知识页面 CRUD、任务 CRUD、任务统计、标签 CRUD、全局搜索 |
| 单元测试 | 认证逻辑、环境变量校验、JWT 中间件、错误处理中间件、Zod 校验 schema（auth/note/page/task） |

---

## 五、团队成员

| 成员 | 角色 |
|------|------|
| 全坤 | 组长 / 项目管理 / 架构师 |
| 肖昌珅 | 后端负责人 |
| 金奕辰 | 前端负责人 |
| 杜承敖 | 全栈开发 |

---

## 六、许可证

MIT License
