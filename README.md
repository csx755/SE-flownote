# 流知 · FlowNote

> 一体化知识与任务协作平台  
> 小组编号：2024LJSE03 | 武汉大学计算机学院 软件工程课程项目

## 项目简介

FlowNote 是一个将碎片信息捕获、知识结构化、任务执行串联起来的生产力工具。核心理念：**碎片便签捕获 → 知识页面结构化 → 任务看板执行**。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Nuxt 3 + TypeScript + shadcn-vue + Tailwind CSS |
| 后端 | Hono + TypeScript + Drizzle ORM |
| 数据库 | PostgreSQL |
| 校验 | Zod |
| Auth | jose + bcryptjs |
| 测试 | Vitest |
| 包管理 | pnpm (monorepo) |
| 容器化 | Docker + Docker Compose |

## 快速开始

### 环境要求

- Node.js 22+
- pnpm 9+
- Docker Desktop（需运行中，鲸鱼图标变绿）

### 方式一：本地开发（推荐日常开发用）

PostgreSQL 用 Docker，API 和 Web 在本地热重载。

```bash
# 1. 安装依赖
pnpm install
# ⚠️ 如果提示 "Ignored build scripts"，执行：
pnpm approve-builds  # 按空格选中 esbuild、@parcel/watcher、vue-demi，回车确认
pnpm install

# 2. 配置环境变量
cp .env.example apps/api/.env
# ⚠️ 必须编辑 apps/api/.env，把 JWT_SECRET 改成随机值！
# 代码拒绝 your-secret-key-here 和 change-me-in-production 占位符
# 示例：JWT_SECRET=my-dev-key-abc123

# 3. 只启动 PostgreSQL（不启动 API 容器）
docker compose up -d postgres
# 预期：Container flownote-db  Started (healthy)

# 4. 初始化数据库
pnpm db:push
# 预期：[✓] Changes applied（首次）或 [i] No changes detected（后续）

# 5. 同时启动 API + Web
pnpm dev
# 预期输出：
#   [api]  🚀 FlowNote API running on http://localhost:3000
#   [api]  📖 API Docs: http://localhost:3000/docs
#   [web]  Nuxt 3 running on http://localhost:3001

# 或分别启动
pnpm --filter @flownote/api dev     # API → http://localhost:3000
pnpm --filter @flownote/web dev     # Web → http://localhost:3001
```

验证：
- API：`curl http://localhost:3000/health` → `{"status":"ok"}`
- API 文档：浏览器打开 <http://localhost:3000/docs>
- 前端：浏览器打开 <http://localhost:3001>

### 方式二：Docker Compose（无需本地 Node）

PostgreSQL + API 全部容器化，只启动前端开发服务。

```bash
# 1. 配置环境变量（同上）
cp .env.example apps/api/.env
vim apps/api/.env   # 修改 JWT_SECRET

# 2. 一键启动 PostgreSQL + API
docker compose up -d
# 预期：flownote-db  Healthy, flownote-api  Started

# 3. 初始化数据库
pnpm db:push

# 4. 启动前端（本地）
pnpm --filter @flownote/web dev
```

验证：
- API：`curl http://localhost:3000/health` → `{"status":"ok"}`
- 前端：浏览器打开 <http://localhost:3001>

### 运行测试

```bash
pnpm --filter @flownote/api test
# 预期：9 passed (9)，Tests 167 passed
```

### API Benchmark

Benchmark 用真实 HTTP 请求压测已启动的 API 服务，模拟“登录 → 捕获笔记 → 转知识页/任务 → 创建任务 → Kanban 状态变更 → 列表/统计/搜索”的实际闭环流程。

```bash
# 1. 先启动 PostgreSQL 和 API，并确保数据库已初始化
docker compose up -d postgres
pnpm db:push
pnpm --filter @flownote/api dev

# 2. 在另一个终端运行 benchmark
pnpm benchmark:api
```

1000 QPS 以上持续压测：

```bash
pnpm benchmark:api:1000qps
```

该脚本默认使用 `sustained` 模式：先创建 32 个虚拟用户，并为每个用户预置 20 组笔记/知识页/任务；随后预热 10 秒，再以 1200 QPS 目标速率持续发压 60 秒，达标阈值为 1000 RPS。请求组合按真实应用偏读写比例混合：列表/看板/统计/详情/搜索为主，穿插笔记捕获、任务创建、任务状态变更和笔记转换。脚本会输出总体 RPS、失败数，以及各操作的 avg/p50/p90/p95/p99/max 延迟；若实际 RPS 低于 1000 或出现失败，请求会以非 0 状态结束。

可通过环境变量调整规模：

```bash
BENCH_USERS=8 BENCH_ITERATIONS=50 pnpm benchmark:api
BENCH_TARGET_QPS=1500 BENCH_MIN_RPS=1500 BENCH_DURATION_SECONDS=120 pnpm benchmark:api:1000qps
```

常用参数：
- `BENCH_BASE_URL`：API 地址，默认 `http://localhost:3000`
- `BENCH_MODE`：`workflow` 或 `sustained`，默认 `workflow`
- `BENCH_USERS`：虚拟用户数，普通模式默认 `4`，1000 QPS 脚本默认 `32`
- `BENCH_ITERATIONS`：普通闭环模式下每个用户执行的业务闭环次数，默认 `25`
- `BENCH_TARGET_QPS`：持续压测目标 QPS，1000 QPS 脚本默认 `1200`
- `BENCH_MIN_RPS`：最低达标 RPS，1000 QPS 脚本默认 `1000`
- `BENCH_DURATION_SECONDS`：持续压测正式统计时长，1000 QPS 脚本默认 `60`
- `BENCH_SEED_ITEMS`：持续压测中每个用户预置数据量，1000 QPS 脚本默认 `20`
- `BENCH_MAX_INFLIGHT`：客户端最大在途请求数，默认 `2000`
- `BENCH_WARMUP_ITERATIONS`：普通模式表示预热闭环次数；持续模式表示预热秒数
- `BENCH_TIMEOUT_MS`：单请求超时时间，默认 `10000`
- `BENCH_CLEANUP=true`：运行结束后尽量删除本次创建的笔记、知识页和任务

## 项目结构

```
flownote/
├── apps/
│   ├── api/             # Hono + Drizzle API 服务
│   └── web/             # Nuxt 3 前端
├── packages/
│   └── shared/          # Drizzle schema + Zod + 共享类型
├── docs/                # 课程文档
│   ├── 0.1-小组章程/
│   ├── 0.2-选题汇报/
│   ├── 1.1-需求捕获/
│   ├── 1.2-需求规格说明/
│   ├── 2.1-项目计划/
│   └── 2.2-MVP阶段/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── AGENTS.md
├── .gitignore
├── LICENSE
└── README.md
```

## 团队成员

| 成员 | 角色 |
|------|------|
| 全坤 | 组长 / 项目管理 / 架构师 |
| 肖昌珅 | 后端负责人 |
| 金奕辰 | 前端负责人 |
| 杜承敖 | 全栈开发 |

## 许可证

MIT License — 详见 [LICENSE](LICENSE)
