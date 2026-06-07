FROM node:22-alpine

# pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 先复制 workspace 配置和依赖清单（利用 Docker 缓存层）
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# shamefully-hoist=true：强制扁平 node_modules，Docker 中 Node 可正常解析
RUN echo "shamefully-hoist=true" >> .npmrc && pnpm install --frozen-lockfile

# 复制源码
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

EXPOSE 3000

# 在 workspace 中 pnpm 只把 tsx 符号链接到 apps/api/node_modules/tsx
# 根 /app/node_modules/ 只有 .pnpm/ 没有 tsx → 必须从包目录启动
WORKDIR /app/apps/api
CMD ["node", "--import", "tsx/esm", "src/index.ts"]
