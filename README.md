# 流知 · FlowNote

> 一体化知识与任务协作平台  
> 小组编号：2024LJSE03 | 武汉大学计算机学院 软件工程课程项目

## 项目简介

FlowNote 是一个将碎片信息捕获、知识结构化、任务执行串联起来的生产力工具。核心理念：**碎片便签捕获 → 知识页面结构化 → 任务看板执行**。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Ant Design Vue |
| 后端 | Node.js + Express.js + Prisma |
| 数据库 | PostgreSQL |
| 容器化 | Docker + Docker Compose |

## 快速开始

### 环境要求

- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose（可选）

### 本地运行

```bash
# 1. 克隆仓库
git clone <repo-url>
cd flownote

# 2. 启动后端
cd backend
cp .env.example .env   # 编辑 .env 填入数据库连接信息
npm install
npx prisma migrate dev
npm run dev

# 3. 启动前端
cd frontend
npm install
npm run dev
```

### Docker 一键启动

```bash
docker-compose up -d
```

## 项目结构

```
flownote/
├── backend/          # Express + Prisma 后端
├── frontend/         # Vue 3 前端
├── docs/             # 课程文档
│   ├── 0.1-小组章程/
│   ├── 0.2-选题汇报/
│   ├── 1.1-需求捕获/
│   ├── 1.2-需求规格说明/
│   ├── 2.1-项目计划/
│   └── 2.2-MVP阶段/
├── docker-compose.yml
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
