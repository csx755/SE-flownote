FROM node:22-alpine

# pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 先复制 workspace 配置和依赖清单（利用 Docker 缓存层）
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# hoisted 模式解决 pnpm workspace 在 Node 中的依赖解析
# 通过 .npmrc 配置，不修改源码文件
RUN echo "node-linker=hoisted" >> .npmrc && pnpm install --frozen-lockfile

# 复制源码
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

EXPOSE 3000

# TODO(M4): Docker 容器运行时 CMD 待完善，当前本地 tsx 已全链路通过
# hoisted 模式 + pnpm exec 在容器中模块解析尚需调试
CMD ["pnpm", "--filter", "@flownote/api", "exec", "tsx", "src/index.ts"]
