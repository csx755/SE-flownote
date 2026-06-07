# FlowNote Web

Nuxt 3 前端，端口 3001。属于 pnpm monorepo，**请从项目根目录执行命令**。

## 环境要求

- Node.js 22+
- pnpm 9+
- API 服务已启动（本地 `pnpm --filter @flownote/api dev` 或 Docker `docker compose up -d`）

## 本地开发

```bash
# 1. 根目录安装依赖
pnpm install

# 2. 同时启动前后端
pnpm dev
# 或单独启动前端
pnpm --filter @flownote/web dev
```

启动后访问 <http://localhost:3001>

## 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 平台介绍 |
| `/login` | 登录 | 邮箱+密码登录 |
| `/register` | 注册 | 用户名+邮箱+密码注册 |
| `/notes` | 笔记列表 | 便签时间线 |
| `/notes/[id]` | 笔记详情 | 查看/编辑/转换 |
| `/pages` | 知识页列表 | 卡片网格 |
| `/pages/[id]` | 知识页详情 | Tiptap 编辑器 |
| `/tasks` | 任务看板 | Kanban 三列 |
| `/tasks/[id]` | 任务详情 | 标题/描述/优先级编辑 |

## 技术栈

- Nuxt 3 + TypeScript
- shadcn-vue + Tailwind CSS
- Tiptap 富文本编辑器
- ECharts + vue-echarts 图表
- Vitest 测试
```
