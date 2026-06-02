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
- Docker & Docker Compose

### 本地运行

```bash
# 1. 克隆仓库
git clone <repo-url>
cd flownote

# 2. 安装依赖
pnpm install

# 3. 启动 PostgreSQL
docker compose up -d

# 4. 初始化数据库
pnpm --filter @flownote/api db:push

# 5. 启动开发服务
pnpm dev
# API → http://localhost:3000
# Web → http://localhost:3001
```

### Docker 一键启动

```bash
docker compose up -d
```

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
