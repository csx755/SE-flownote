# 流知·FlowNote 软件实现计划

> **文档版本**：v1.0  
> **编制日期**：2026年6月1日  
> **小组编号**：2024LJSE03  
> **小组成员**：Per_B（组长）、Per_A、Per_C、Per_D

---

## 一、项目概览

### 1.1 项目目标

在 **2026年6月30日** 前完成 FlowNote v1.0 MVP 版本的开发、测试与交付，核心验证"碎片捕获→知识结构化→任务执行"的闭环工作流。

### 1.2 技术栈（已确定）

| 层级 | 技术选型 | 版本 | 用途 |
|------|---------|------|------|
| 前端框架 | Vue 3 + TypeScript | 3.4+ | 用户界面 |
| UI 组件库 | Ant Design Vue | 4.x | 通用组件 |
| Markdown 编辑器 | ByteMD 或 Vditor | - | 知识页面编辑 |
| 图谱可视化 | ECharts（力导向图） | 5.x | 知识图谱 |
| 后端框架 | Node.js + Express.js | 20 LTS | REST API |
| 数据库 | PostgreSQL | 16.x | 主数据存储 |
| ORM | Prisma | latest | 数据库访问 |
| 认证 | JWT + bcrypt | - | 用户认证 |
| 搜索 | fuse.js / flexsearch | - | 前端模糊搜索 |
| 容器化 | Docker + Docker Compose | 24+ | 环境标准化 |
| 版本控制 | Git + GitHub | - | 代码管理 |
| CI/CD | GitHub Actions | - | 自动构建与测试 |
| API 文档 | Swagger / OpenAPI 3.0 | - | 接口文档 |
| 测试 | Jest + Cypress | - | 单元测试 + E2E |

### 1.3 团队分工

| 成员 | 角色 | 主要职责 |
|------|------|---------|
| Per_B | 项目管理 / 架构师 | 项目管理、架构设计、验收测试、课堂报告 |
| Per_A | 后端负责人 | 数据库设计、API 设计、用户认证、部署运维 |
| Per_C | 前端负责人 | 前端 UI/UX、便签模块、任务管理模块、测试 |
| Per_D | 全栈开发 | 知识管理模块、Markdown 编辑器集成、图谱可视化 |

---

## 二、Sprint 计划总览

项目采用 **敏捷迭代开发**，共分 **4 个 Sprint**，每个 Sprint 约 **5-7 个工作日**。

```
Sprint 0 (6/1-6/5)   ── 基础设施搭建 + 系统设计
Sprint 1 (6/6-6/13)  ── 核心功能 MVP
Sprint 2 (6/14-6/22) ── 功能完善 + 集成联调
Sprint 3 (6/23-6/30) ── 测试修复 + 交付准备
```

### 里程碑时间线

```
6/1   ── M0: 课堂报告 + Sprint 0 启动
6/5   ── M1: 系统设计完成，开发环境就绪
6/13  ── M2: Sprint 1 完成，核心功能可演示
6/22  ── M3: Sprint 2 完成，功能冻结
6/28  ── M4: 测试完成，缺陷清零
6/30  ── M5: 最终交付
```

---

## 三、Sprint 0 — 基础设施与系统设计（6/1 - 6/5）

> **目标**：完成所有设计工作，开发环境搭建完毕，团队可以开始编码。

### 3.1 Feature 清单

| Feature ID | Feature 名称 | 优先级 | 负责人 | 预估工时 | 交付物 |
|-----------|-------------|--------|--------|---------|--------|
| F-001 | 项目仓库初始化 | P0 | Per_A | 2h | GitHub 仓库、分支策略、CI 基础配置 |
| F-002 | Docker 开发环境 | P0 | Per_A | 3h | docker-compose.yml（Node + PG + Redis） |
| F-003 | 前端脚手架搭建 | P0 | Per_C | 3h | Vue 3 + TS + Ant Design Vue + 路由 + 状态管理 |
| F-004 | 后端脚手架搭建 | P0 | Per_A | 3h | Express + Prisma + JWT 中间件 + Swagger |
| F-005 | 数据库 Schema 设计 | P0 | Per_A | 4h | Prisma schema（全部表结构 + 关系） |
| F-006 | 系统架构设计文档 | P0 | Per_B | 4h | 架构图、模块划分、部署架构 |
| F-007 | API 接口设计 | P0 | Per_A | 4h | Swagger 文档（全部 v1.0 接口） |
| F-008 | 前端 UI 原型设计 | P1 | Per_C | 6h | 核心页面线框图/高保真原型 |
| F-009 | 数据库 ER 图定稿 | P0 | Per_D | 3h | ER 图 + 数据字典 |

### 3.2 数据库 Schema 设计（F-005 详细说明）

基于 SRS 文档中的 ER 图，Prisma schema 需要定义以下核心模型：

```prisma
// ===== 用户 =====
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  password  String   // bcrypt hash
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  notes           Note[]
  knowledgePages  KnowledgePage[]
  tasks           Task[]
  tags            Tag[]
  memoryCards     MemoryCard[]
  pomodoroRecords PomodoroRecord[]
  boards          Board[]
}

// ===== 便签 =====
model Note {
  id          Int      @id @default(autoincrement())
  content     String   // 便签内容（纯文本或 Markdown）
  contentType String   @default("TEXT") // TEXT | MARKDOWN
  isArchived  Boolean  @default(false)
  isMerged    Boolean  @default(false) // 是否已合并到知识页面
  userId      Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user         User              @relation(fields: [userId], references: [id])
  tags         Tag[]
  sourceTasks  Task[]            @relation("SourceNote") // 从此便签转化的任务
  mergedTo     KnowledgePage?    @relation(fields: [mergedToId], references: [id])
  mergedToId   Int?
}

// ===== 知识页面 =====
model KnowledgePage {
  id        Int      @id @default(autoincrement())
  title     String
  content   String   // Markdown 内容
  isArchived Boolean @default(false)
  userId    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user        User              @relation(fields: [userId], references: [id])
  tags        Tag[]
  mergedNotes Note[]            @relation("MergedFrom")
  sourceTasks Task[]            @relation("SourcePage")
  outgoingLinks BidirectionalLink[] @relation("SourcePage")
  incomingLinks BidirectionalLink[] @relation("TargetPage")
}

// ===== 双向链接 =====
model BidirectionalLink {
  id         Int    @id @default(autoincrement())
  sourceId   Int    // 来源页面 ID
  targetId   Int    // 目标页面 ID
  sourceType String @default("KNOWLEDGE_PAGE") // NOTE | KNOWLEDGE_PAGE
  targetType String @default("KNOWLEDGE_PAGE") // NOTE | KNOWLEDGE_PAGE

  sourcePage KnowledgePage @relation("SourcePage", fields: [sourceId], references: [id])
  targetPage KnowledgePage @relation("TargetPage", fields: [targetId], references: [id])

  @@unique([sourceId, targetId]) // 防止重复链接
}

// ===== 标签 =====
model Tag {
  id    Int    @id @default(autoincrement())
  name  String
  color String? @default("#1890ff")
  userId Int

  user    User    @relation(fields: [userId], references: [id])
  notes   Note[]
  pages   KnowledgePage[]
  tasks   Task[]

  @@unique([name, userId]) // 同一用户下标签名唯一
}

// ===== 任务 =====
model Task {
  id              Int      @id @default(autoincrement())
  title           String
  description     String?
  status          String   @default("TODO") // TODO | IN_PROGRESS | IN_REVIEW | DONE | ARCHIVED
  priority        String   @default("MEDIUM") // LOW | MEDIUM | HIGH | URGENT
  dueDate         DateTime?
  estimatedMinutes Int?
  sourceType      String?  // NOTE | KNOWLEDGE_PAGE
  sourceId        Int?     // 来源便签/页面 ID
  boardId         Int?
  columnId        Int?
  userId          Int
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user        User          @relation(fields: [userId], references: [id])
  board       Board?        @relation(fields: [boardId], references: [id])
  sourceNote  Note?         @relation("SourceNote", fields: [sourceId], references: [id])
  sourcePage  KnowledgePage? @relation("SourcePage", fields: [sourceId], references: [id])
  tags        Tag[]
}

// ===== 看板 =====
model Board {
  id     Int    @id @default(autoincrement())
  name   String
  userId Int

  user    User    @relation(fields: [userId], references: [id])
  columns BoardColumn[]
  tasks   Task[]
}

model BoardColumn {
  id      Int    @id @default(autoincrement())
  name    String
  order   Int
  boardId Int

  board Board @relation(fields: [boardId], references: [id])
  tasks Task[]
}

// ===== 记忆卡片（间隔重复） =====
model MemoryCard {
  id              Int      @id @default(autoincrement())
  front           String   // 正面（问题）
  back            String   // 背面（答案）
  difficulty      Float    @default(2.5) // SM-2 难度因子
  interval        Int      @default(0)   // 当前间隔（天）
  repetition      Int      @default(0)   // 连续正确次数
  nextReviewDate  DateTime // 下次复习日期
  status          String   @default("LEARNING") // LEARNING | REVIEWING | MASTERED
  userId          Int
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}

// ===== 番茄钟记录 =====
model PomodoroRecord {
  id        Int      @id @default(autoincrement())
  duration  Int      @default(25) // 实际专注时长（分钟）
  completed Boolean  @default(false)
  userId    Int
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

### 3.3 API 接口设计（F-007 详细说明）

所有接口遵循 RESTful 规范，统一前缀 `/api/v1`，认证接口除外。

#### 认证模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 | 否 |
| POST | `/api/v1/auth/login` | 用户登录（返回 JWT） | 否 |
| GET | `/api/v1/auth/profile` | 获取当前用户信息 | 是 |
| PUT | `/api/v1/auth/profile` | 更新用户信息 | 是 |

#### 便签模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/notes` | 获取便签列表（支持分页、标签筛选、时间范围） | 是 |
| POST | `/api/v1/notes` | 创建便签 | 是 |
| GET | `/api/v1/notes/:id` | 获取单个便签详情 | 是 |
| PUT | `/api/v1/notes/:id` | 编辑便签内容 | 是 |
| DELETE | `/api/v1/notes/:id` | 删除便签 | 是 |
| PUT | `/api/v1/notes/:id/archive` | 归档/取消归档 | 是 |
| POST | `/api/v1/notes/:id/convert-to-page` | 便签转知识页面 | 是 |
| POST | `/api/v1/notes/:id/convert-to-task` | 便签转任务 | 是 |
| POST | `/api/v1/notes/:id/merge-to-page/:pageId` | 便签合并到已有页面 | 是 |

#### 知识页面模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/pages` | 获取知识页面列表 | 是 |
| POST | `/api/v1/pages` | 创建知识页面 | 是 |
| GET | `/api/v1/pages/:id` | 获取页面详情（含反向链接） | 是 |
| PUT | `/api/v1/pages/:id` | 编辑页面内容 | 是 |
| DELETE | `/api/v1/pages/:id` | 删除页面 | 是 |
| GET | `/api/v1/pages/:id/backlinks` | 获取引用当前页面的所有链接 | 是 |
| POST | `/api/v1/pages/:id/convert-to-task` | 页面转任务 | 是 |

#### 双向链接模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/links` | 创建双向链接 | 是 |
| DELETE | `/api/v1/links/:id` | 删除链接 | 是 |
| GET | `/api/v1/links/graph` | 获取知识图谱数据（节点+边） | 是 |

#### 任务模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/tasks` | 获取任务列表（支持看板筛选） | 是 |
| POST | `/api/v1/tasks` | 创建任务 | 是 |
| GET | `/api/v1/tasks/:id` | 获取任务详情 | 是 |
| PUT | `/api/v1/tasks/:id` | 编辑任务 | 是 |
| DELETE | `/api/v1/tasks/:id` | 删除任务（仅 TODO 状态） | 是 |
| PUT | `/api/v1/tasks/:id/status` | 更新任务状态 | 是 |
| PUT | `/api/v1/tasks/:id/reorder` | 调整任务在看板中的位置 | 是 |

#### 看板模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/boards` | 获取看板列表 | 是 |
| POST | `/api/v1/boards` | 创建看板 | 是 |
| GET | `/api/v1/boards/:id` | 获取看板详情（含列和任务） | 是 |
| PUT | `/api/v1/boards/:id` | 编辑看板 | 是 |
| DELETE | `/api/v1/boards/:id` | 删除看板 | 是 |

#### 番茄钟模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/pomodoro/start` | 开始番茄钟 | 是 |
| POST | `/api/v1/pomodoro/complete` | 完成番茄钟（记录） | 是 |
| GET | `/api/v1/pomodoro/stats` | 获取番茄钟统计 | 是 |

#### 标签模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/tags` | 获取标签列表 | 是 |
| POST | `/api/v1/tags` | 创建标签 | 是 |
| DELETE | `/api/v1/tags/:id` | 删除标签 | 是 |

#### 记忆卡片模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/cards/due` | 获取今日待复习卡片 | 是 |
| POST | `/api/v1/cards` | 创建记忆卡片 | 是 |
| PUT | `/api/v1/cards/:id/review` | 提交复习结果（SM-2 算法更新） | 是 |

#### 搜索模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/search?q=关键词` | 全局搜索（便签+页面+任务） | 是 |

### 3.4 Sprint 0 验收标准

- [ ] GitHub 仓库创建，分支策略（main/develop/feature/*）配置完成
- [ ] `docker-compose up` 一键启动完整开发环境（Node + PG + Redis）
- [ ] 前端项目可运行，首页框架渲染正常
- [ ] 后端项目可运行，Swagger 文档可访问（`/api-docs`）
- [ ] Prisma schema 生成并成功 migrate 到本地 PG
- [ ] 所有 API 接口在 Swagger 中有完整定义
- [ ] 核心页面 UI 原型完成（首页时间线、知识页面编辑、任务看板）

---

## 四、Sprint 1 — 核心功能 MVP（6/6 - 6/13）

> **目标**：完成核心业务功能，实现"便签→知识→任务"的基本流转。

### 4.1 Feature 清单

| Feature ID | Feature 名称 | 优先级 | 负责人 | 预估工时 | 依赖 |
|-----------|-------------|--------|--------|---------|------|
| F-010 | 用户注册/登录 | P0 | Per_A | 4h | F-004 |
| F-011 | 便签 CRUD | P0 | Per_C | 6h | F-003, F-005 |
| F-012 | 便签时间线视图 | P0 | Per_C | 4h | F-011 |
| F-013 | 便签转知识页面 | P0 | Per_D | 5h | F-011, F-015 |
| F-014 | 便签转任务 | P0 | Per_C | 4h | F-011, F-019 |
| F-015 | 知识页面 CRUD | P0 | Per_D | 6h | F-003, F-005 |
| F-016 | Markdown 编辑器集成 | P0 | Per_D | 5h | F-015 |
| F-017 | 双向链接创建与删除 | P0 | Per_A | 5h | F-005 |
| F-018 | 反向链接查询 | P0 | Per_A | 3h | F-017 |
| F-019 | 任务看板（CRUD + 拖拽） | P0 | Per_C | 8h | F-003, F-005 |
| F-020 | 任务状态流转 | P0 | Per_C | 3h | F-019 |
| F-021 | 标签系统 | P1 | Per_A | 4h | F-005 |
| F-022 | 全局搜索 | P1 | Per_D | 4h | F-011, F-015 |

### 4.2 各 Feature 详细实现说明

#### F-010 用户注册/登录

**后端（Per_A）**：
- POST `/api/v1/auth/register`：校验用户名唯一性、邮箱格式，密码 bcrypt 加密存储，返回 JWT
- POST `/api/v1/auth/login`：验证密码，返回 JWT（有效期 7 天）
- JWT 中间件：解析 Authorization header，注入 userId 到 request
- 密码强度要求：≥8 位，包含字母和数字

**前端（Per_C）**：
- 登录页面：用户名/密码表单，登录成功后跳转首页
- 注册页面：用户名、邮箱、密码、确认密码
- 路由守卫：未登录时重定向到登录页
- Token 存储：localStorage，axios 拦截器自动附加 Authorization header

#### F-011 便签 CRUD

**后端（Per_A）**：
- GET `/api/v1/notes`：支持 `page`、`pageSize`、`tag`、`archived`、`startDate`、`endDate` 查询参数
- POST `/api/v1/notes`：创建便签，自动关联当前用户
- PUT `/api/v1/notes/:id`：仅允许编辑自己的便签
- DELETE `/api/v1/notes/:id`：软删除（标记 isArchived）

**前端（Per_C）**：
- 便签输入组件：页面顶部固定输入框，支持 Ctrl+Enter 快速提交
- 便签卡片组件：显示内容、标签、时间、操作按钮（编辑/归档/删除/转化）
- 标签选择器：创建便签时可选择或新建标签

#### F-012 便签时间线视图

**前端（Per_C）**：
- 按日期分组展示便签（今天/昨天/更早）
- 虚拟滚动加载（大量便签时保持性能）
- 筛选栏：按标签、时间范围、归档状态筛选
- 空状态引导：无便签时显示"创建你的第一条便签"

#### F-015 知识页面 CRUD + F-016 Markdown 编辑器

**后端（Per_D）**：
- GET `/api/v1/pages`：支持分页和标签筛选
- POST `/api/v1/pages`：创建页面，自动生成标题（取内容前 20 字）
- PUT `/api/v1/pages/:id`：更新 Markdown 内容

**前端（Per_D）**：
- Markdown 编辑器：使用 ByteMD 或 Vditor，支持实时预览
- 编辑器工具栏：加粗、斜体、标题、链接、代码块、图片
- 页面标题可编辑，内容区全屏编辑模式
- 自动保存：编辑停止 3 秒后自动保存（防抖）

#### F-013 便签转知识页面

**后端（Per_D）**：
- POST `/api/v1/notes/:id/convert-to-page`：
  1. 创建新 KnowledgePage，content 为便签内容
  2. 标记便签 isMerged = true
  3. 返回新页面 ID

  **前端（Per_D）**：
- 便签卡片上"转为知识页面"按钮
- 点击后跳转到新创建的知识页面编辑视图

#### F-017 双向链接 + F-018 反向链接

**后端（Per_A）**：
- POST `/api/v1/links`：body `{ sourceId, targetId, sourceType, targetType }`
  - 校验源和目标页面存在
  - 校验不能自链接
  - 自动创建双向关系（只存一条记录，查询时双向检索）
- DELETE `/api/v1/links/:id`：删除链接
- GET `/api/v1/pages/:id/backlinks`：查询所有 targetId = id 的链接
- GET `/api/v1/links/graph`：返回所有节点和边，格式：
  ```json
  {
    "nodes": [{ "id": 1, "name": "页面标题", "type": "KNOWLEDGE_PAGE" }],
    "edges": [{ "source": 1, "target": 2 }]
  }
  ```

  **前端（Per_D）**：
- 知识页面编辑器中输入 `[[` 触发链接搜索弹窗
- 搜索弹窗：模糊匹配已有页面标题，选择后插入链接
- 页面底部显示"被引用"列表（反向链接）

#### F-019 任务看板 + F-020 任务状态流转

**后端（Per_A）**：
- 看板 CRUD 接口
- 任务状态更新：PUT `/api/v1/tasks/:id/status`，校验合法状态转换
- 任务排序：PUT `/api/v1/tasks/:id/reorder`，更新 columnId 和排序

**前端（Per_C）**：
- 看板视图：4 列（待办 / 进行中 / 审核中 / 已完成）
- 拖拽排序：使用 vuedraggable 或 @vueuse/integrations
- 任务卡片：标题、优先级标签、截止日期、来源标记
- 新建任务弹窗：标题、描述、优先级、截止日期
- 点击任务卡片展开详情侧边栏

#### F-021 标签系统

**后端（Per_A）**：
- 标签 CRUD
- 便签/页面/任务关联标签（多对多关系）
- 按标签筛选内容

**前端（Per_C）**：
- 标签管理页面：创建、编辑颜色、删除
- 内容编辑时的标签选择器（支持多选）
- 侧边栏标签列表，点击筛选

### 4.3 Sprint 1 每日计划

| 日期 | Per_A | Per_C | Per_D | Per_B |
|------|--------|--------|--------|------|
| 6/6 (五) | F-010 用户认证 | F-011 便签 CRUD 后端联调 | F-015 知识页面后端 | 架构设计文档收尾 |
| 6/7 (六) | F-017 双向链接后端 | F-011 便签前端 UI | F-016 Markdown 编辑器 | 代码审查 |
| 6/8 (日) | F-018 反向链接 | F-012 时间线视图 | F-013 便签转页面 | 代码审查 |
| 6/9 (一) | F-021 标签系统 | F-014 便签转任务 | F-015 页面前端 UI | 进度跟踪 |
| 6/10 (二) | F-019 任务看板后端 | F-019 任务看板前端 | F-022 全局搜索 | 代码审查 |
| 6/11 (三) | F-020 任务状态流转 | F-019 拖拽排序 | F-017 链接前端 UI | 进度跟踪 |
| 6/12 (四) | Bug 修复 + 联调 | Bug 修复 + 联调 | Bug 修复 + 联调 | 集成测试 |
| 6/13 (五) | Sprint 1 演示 + 回顾 | Sprint 1 演示 + 回顾 | Sprint 1 演示 + 回顾 | Sprint 1 评审 |

### 4.4 Sprint 1 验收标准

- [ ] 用户可以注册、登录、退出
- [ ] 用户可以创建、编辑、归档、删除便签
- [ ] 便签按时间线展示，支持标签筛选
- [ ] 便签可以一键转为知识页面
- [ ] 便签可以一键转为任务
- [ ] 知识页面支持 Markdown 编辑和实时预览
- [ ] 知识页面之间可以创建双向链接
- [ ] 知识页面显示反向链接列表
- [ ] 任务看板支持拖拽排序和状态流转
- [ ] 标签可以创建并关联到便签/页面/任务
- [ ] 全局搜索可以找到便签、页面和任务

---

## 五、Sprint 2 — 功能完善与集成联调（6/14 - 6/22）

> **目标**：完成剩余功能，前后端全面集成，系统可完整运行。

### 5.1 Feature 清单

| Feature ID | Feature 名称 | 优先级 | 负责人 | 预估工时 | 依赖 |
|-----------|-------------|--------|--------|---------|------|
| F-023 | 知识图谱可视化 | P0 | Per_D | 8h | F-017 |
| F-024 | 番茄钟计时器 | P1 | Per_C | 6h | F-003 |
| F-025 | 记忆卡片（SM-2 算法） | P1 | Per_A | 6h | F-005 |
| F-026 | 便签合并到已有页面 | P1 | Per_D | 4h | F-015 |
| F-027 | Markdown 导入导出 | P1 | Per_A | 4h | F-015 |
| F-028 | 页面归档与恢复 | P2 | Per_C | 2h | F-015 |
| F-029 | 前端整体 UI 优化 | P1 | Per_C | 6h | F-011~F-022 |
| F-030 | 前后端全面联调 | P0 | 全员 | 8h | 全部 |
| F-031 | Docker 部署配置 | P0 | Per_A | 4h | F-030 |
| F-032 | Swagger API 文档完善 | P1 | Per_A | 2h | F-030 |

### 5.2 各 Feature 详细实现说明

#### F-023 知识图谱可视化

**后端（Per_D）**：
- GET `/api/v1/links/graph` 返回完整图数据
- 支持查询参数 `depth` 控制展开深度（默认 2 层）
- 节点包含：id、name、type（NOTE / KNOWLEDGE_PAGE）、标签颜色

**前端（Per_D）**：
- 使用 ECharts 力导向图（graph 类型）
- 节点样式：知识页面用圆形，便签用方形，颜色按标签区分
- 边样式：有向箭头表示引用方向
- 交互功能：
  - 点击节点跳转到对应页面
  - 鼠标悬浮显示节点标题和摘要
  - 拖拽节点调整布局
  - 缩放和平移
- 性能优化：节点数 > 200 时启用节点聚类，> 500 时分层加载

#### F-024 番茄钟计时器

**后端（Per_A）**：
- POST `/api/v1/pomodoro/start`：创建记录
- POST `/api/v1/pomodoro/complete`：标记完成，记录实际时长
- GET `/api/v1/pomodoro/stats`：返回今日/本周完成次数

**前端（Per_C）**：
- 倒计时组件：25 分钟倒计时，环形进度条
- 控制按钮：开始 / 暂停 / 重置
- 完成提示：弹窗 + 浏览器通知（需用户授权）
- 今日统计：已完成番茄数、总专注时长
- 倒计时结束自动记录到后端

#### F-025 记忆卡片（SM-2 算法）

**后端（Per_A）**：
- SM-2 算法实现：
  ```
  输入：quality（0-5 评分）、repetition、easeFactor、interval
  输出：更新后的 repetition、easeFactor、interval、nextReviewDate
  
  if quality >= 3:  // 正确
    if repetition == 0: interval = 1
    elif repetition == 1: interval = 6
    else: interval = round(interval * easeFactor)
    repetition += 1
  else:  // 错误
    repetition = 0
    interval = 1
  
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if easeFactor < 1.3: easeFactor = 1.3
  
  nextReviewDate = now + interval days
  ```
- GET `/api/v1/cards/due`：返回 nextReviewDate ≤ 今天的卡片
- PUT `/api/v1/cards/:id/review`：接收 quality 评分，执行 SM-2 更新

**前端（Per_C）**：
- 复习模式：卡片翻转（正面→点击→背面）
- 评分按钮：0（完全不会）~ 5（非常简单）
- 今日进度：已复习 / 待复习数量
- 创建卡片入口：从知识页面选中文本快速创建

#### F-026 便签合并到已有页面

**后端（Per_D）**：
- POST `/api/v1/notes/:id/merge-to-page/:pageId`：
  1. 将便签内容追加到页面末尾
  2. 标记便签 isMerged = true
  3. 记录合并来源（便于后续拆分）

  **前端（Per_D）**：
- 便签卡片上"合并到页面"按钮
- 弹窗搜索已有知识页面
- 选择目标页面后确认合并

### 5.3 Sprint 2 每日计划

| 日期 | Per_A | Per_C | Per_D | Per_B |
|------|--------|--------|--------|------|
| 6/14 (六) | F-025 SM-2 算法 | F-024 番茄钟前端 | F-023 图谱可视化 | 进度跟踪 |
| 6/15 (日) | F-025 卡片接口 | F-024 番茄钟联调 | F-023 图谱交互 | 代码审查 |
| 6/16 (一) | F-027 Markdown 导入导出 | F-029 UI 优化 | F-026 便签合并 | 进度跟踪 |
| 6/17 (二) | F-031 Docker 部署 | F-029 UI 优化 | F-023 图谱性能优化 | 进度跟踪 |
| 6/18 (三) | F-030 联调（后端接口） | F-030 联调（前端对接） | F-030 联调（图谱+编辑器） | 集成测试 |
| 6/19 (四) | F-030 联调 | F-030 联调 | F-030 联调 | 集成测试 |
| 6/20 (五) | F-030 联调 + F-032 | F-028 归档功能 | F-030 联调 | 集成测试 |
| 6/21 (六) | Bug 修复 | Bug 修复 | Bug 修复 | 回归测试 |
| 6/22 (日) | Sprint 2 演示 + 回顾 | Sprint 2 演示 + 回顾 | Sprint 2 演示 + 回顾 | Sprint 2 评审 |

### 5.4 Sprint 2 验收标准

- [ ] 知识图谱可视化正常渲染，节点可交互
- [ ] 番茄钟倒计时、暂停、完成记录正常
- [ ] 记忆卡片复习流程完整，SM-2 算法正确更新间隔
- [ ] 便签可以合并到已有知识页面
- [ ] 知识页面支持 Markdown 导入导出
- [ ] 前端 UI 统一、交互流畅
- [ ] 前后端联调通过，所有接口正常工作
- [ ] Docker 一键部署成功

---

## 六、Sprint 3 — 测试修复与交付准备（6/23 - 6/30）

> **目标**：全面测试，修复缺陷，准备交付材料。

### 6.1 Feature 清单

| Feature ID | Feature 名称 | 优先级 | 负责人 | 预估工时 | 依赖 |
|-----------|-------------|--------|--------|---------|------|
| F-033 | 单元测试编写 | P0 | 全员 | 8h | F-010~F-032 |
| F-034 | E2E 测试编写 | P0 | Per_C | 6h | F-030 |
| F-035 | 性能测试 | P1 | Per_D | 4h | F-030 |
| F-036 | 缺陷修复 | P0 | 全员 | 12h | F-033, F-034 |
| F-037 | 用户手册编写 | P1 | Per_B | 4h | F-030 |
| F-038 | 部署文档编写 | P1 | Per_A | 3h | F-031 |
| F-039 | 课堂报告 PPT | P0 | Per_B | 4h | 全部 |
| F-040 | 最终部署与验证 | P0 | Per_A | 4h | F-036 |

### 6.2 测试计划

#### 单元测试（F-033）

| 模块 | 测试内容 | 负责人 | 工具 |
|------|---------|--------|------|
| 认证 | 注册/登录/JWT 验证 | Per_A | Jest |
| 便签 | CRUD/归档/转化 | Per_C | Jest |
| 知识页面 | CRUD/链接/反链 | Per_D | Jest |
| 任务 | CRUD/状态流转/排序 | Per_C | Jest |
| SM-2 算法 | 各种 quality 输入的间隔计算 | Per_A | Jest |
| 标签 | CRUD/关联/筛选 | Per_A | Jest |

目标覆盖率：核心业务逻辑 ≥ 80%

#### E2E 测试（F-034）

使用 Cypress 编写，覆盖核心用户流程：

| 测试场景 | 测试步骤 | 预期结果 |
|---------|---------|---------|
| TC-01 注册登录 | 注册新用户 → 登录 → 验证 JWT | 成功登录，跳转首页 |
| TC-02 便签流程 | 创建便签 → 编辑 → 归档 → 查看时间线 | 便签正确展示和操作 |
| TC-03 知识流转 | 便签转页面 → 编辑 → 添加链接 → 查看图谱 | 流转完整，图谱正确 |
| TC-04 任务管理 | 创建任务 → 拖拽到进行中 → 标记完成 | 状态正确更新 |
| TC-05 番茄钟 | 启动 → 等待完成 → 查看记录 | 记录正确保存 |
| TC-06 记忆卡片 | 创建卡片 → 复习 → 评分 → 查看下次复习日期 | SM-2 正确更新 |

#### 性能测试（F-035）

| 测试项 | 目标指标 | 测试方法 |
|--------|---------|---------|
| 首页加载 | ≤ 2s | Lighthouse |
| API 响应 | 95% ≤ 1s | Artillery / k6 |
| 500 节点图谱渲染 | ≤ 5s | 手动测试 |
| 100 条便签时间线 | ≤ 2s | 手动测试 |

### 6.3 Sprint 3 每日计划

| 日期 | Per_A | Per_C | Per_D | Per_B |
|------|--------|--------|--------|------|
| 6/23 (一) | F-033 单元测试 | F-033 单元测试 | F-033 单元测试 | F-037 用户手册 |
| 6/24 (二) | F-033 单元测试 | F-034 E2E 测试 | F-035 性能测试 | F-037 用户手册 |
| 6/25 (三) | F-036 缺陷修复 | F-034 E2E 测试 | F-036 缺陷修复 | F-039 PPT |
| 6/26 (四) | F-036 缺陷修复 | F-036 缺陷修复 | F-036 缺陷修复 | F-039 PPT |
| 6/27 (五) | F-036 回归测试 | F-036 回归测试 | F-036 回归测试 | F-039 PPT |
| 6/28 (六) | F-038 部署文档 | F-036 最终验证 | F-036 最终验证 | 验收测试 |
| 6/29 (日) | F-040 最终部署 | 最终验证 | 最终验证 | 验收测试 |
| 6/30 (一) | 交付 | 交付 | 交付 | 交付 |

### 6.4 Sprint 3 验收标准

- [ ] 单元测试覆盖率 ≥ 80%（核心业务逻辑）
- [ ] E2E 测试全部通过
- [ ] 性能指标达标
- [ ] 所有 Critical 和 Major 缺陷已修复
- [ ] 用户手册完成
- [ ] 部署文档完成
- [ ] 课堂报告 PPT 完成
- [ ] 系统成功部署到服务器

---

## 七、风险管理

| 风险 ID | 风险描述 | 概率 | 影响 | 应对策略 | 负责人 |
|---------|---------|------|------|---------|--------|
| R1 | 双向链接图谱性能不足 | 中 | 高 | 节点 > 200 时启用聚类，> 500 时分层加载；备选方案：简化为列表视图 | Per_D |
| R2 | 前后端联调耗时超预期 | 高 | 高 | Sprint 1 每天预留 1h 联调时间；接口变更必须同步 Swagger 文档 | Per_B |
| R3 | Markdown 编辑器集成困难 | 中 | 中 | 备选方案：ByteMD → Vditor → 简单 textarea + 预览 | Per_D |
| R4 | 期末考试时间冲突 | 高 | 高 | 6/20 前完成核心功能；6/20-6/30 降低每日工时预期；关键模块 pair work | Per_B |
| R5 | SM-2 算法实现偏差 | 低 | 中 | 参考开源实现（ts-fsrs 库），编写充分的单元测试验证 | Per_A |
| R6 | Docker 环境在不同机器不一致 | 中 | 中 | 使用 docker-compose 统一环境；CI 中运行集成测试验证 | Per_A |

---

## 八、质量保证

### 8.1 代码规范

- **前端**：ESLint + Prettier，TypeScript strict 模式
- **后端**：ESLint + Prettier，JSDoc 注释公共 API
- **Git**：Conventional Commits 规范（feat/fix/docs/refactor/test）

### 8.2 分支策略

```
main          ← 稳定发布，只接受 develop 合并
  └── develop ← 开发主线，每日合并 feature 分支
       ├── feature/auth
       ├── feature/note
       ├── feature/knowledge
       ├── feature/task
       ├── feature/graph
       └── feature/pomodoro
```

- 每个 Feature 在独立分支开发
- 合并到 develop 需至少 1 人 Code Review
- develop 每日自动构建 + 测试（GitHub Actions）

### 8.3 缺陷管理

| 等级 | 定义 | 修复时限 |
|------|------|---------|
| Critical | 系统崩溃、数据丢失、安全漏洞 | 当天修复 |
| Major | 核心功能不可用 | 24h 内修复 |
| Minor | 功能异常但有 workaround | 48h 内修复 |
| Trivial | UI 美观、文案等 | 评估后排期 |

---

## 九、验收标准汇总

### 9.1 功能验收

| 编号 | 验收项 | 通过标准 |
|------|--------|---------|
| AT-01 | 用户认证 | 注册、登录、退出正常，JWT 验证有效 |
| AT-02 | 便签管理 | CRUD、归档、时间线展示正常 |
| AT-03 | 便签转知识页面 | 一键转换，内容完整保留 |
| AT-04 | 便签转任务 | 一键转换，任务出现在看板 |
| AT-05 | 知识页面编辑 | Markdown 编辑、预览、自动保存正常 |
| AT-06 | 双向链接 | 创建、删除、反向链接查询正常 |
| AT-07 | 知识图谱 | 可视化渲染、节点交互、跳转正常 |
| AT-08 | 任务看板 | CRUD、拖拽排序、状态流转正常 |
| AT-09 | 番茄钟 | 倒计时、暂停、完成记录正常 |
| AT-10 | 记忆卡片 | SM-2 算法正确，复习流程完整 |
| AT-11 | 标签系统 | 创建、关联、筛选正常 |
| AT-12 | 全局搜索 | 便签、页面、任务均可搜索到 |

### 9.2 非功能验收

| 编号 | 验收项 | 通过标准 |
|------|--------|---------|
| NF-01 | 性能 | 95% API 请求 ≤ 1s，首页加载 ≤ 2s |
| NF-02 | 安全性 | 密码加密存储，JWT 验证有效，无 SQL 注入 |
| NF-03 | 可用性 | 核心流程无需文档即可操作 |
| NF-04 | 兼容性 | Chrome/Edge/Firefox 最新版正常运行 |
| NF-05 | 部署 | Docker 一键部署成功 |

---

## 十、交付物清单

| 序号 | 交付物 | 格式 | 负责人 | 截止日期 |
|------|--------|------|--------|---------|
| 1 | 软件实现计划（本文档） | Markdown | Per_B | 6/1 |
| 2 | 系统设计文档 | Markdown | Per_B | 6/5 |
| 3 | 源代码（GitHub 仓库） | Git | 全员 | 6/30 |
| 4 | 可运行的 MVP 系统 | Docker | Per_A | 6/30 |
| 5 | 测试报告 | Markdown | Per_C | 6/28 |
| 6 | 用户手册 | Markdown | Per_B | 6/28 |
| 7 | 部署文档 | Markdown | Per_A | 6/28 |
| 8 | 课堂报告 PPT | PPTX | Per_B | 6/30 |
| 9 | 验收测试计划与用例 | Markdown | Per_B | 6/23 |

---

> **文档结束**  
> 本文档将随项目进展持续更新。每次 Sprint 回顾后由Per_B负责修订版本号和修订历史。
