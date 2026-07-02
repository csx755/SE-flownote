#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "  FlowNote 一键安装脚本"
echo "========================================"
echo ""

# ── 1. Node.js ─────────────────────────────────
echo "[1/6] 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误] 未找到 Node.js，请先安装 Node.js 22+${NC}"
    echo "   下载: https://nodejs.org/"
    exit 1
fi
NODE_MAJOR=$(node -v | cut -d. -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 22 ]; then
    echo -e "${RED}[错误] Node.js 版本过旧，需要 22+${NC}"
    node -v
    exit 1
fi
echo "   Node.js: $(node -v)"

# ── 2. pnpm ────────────────────────────────────
echo "[2/6] 检查 pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}[提示] 正在安装 pnpm...${NC}"
    corepack enable
    corepack prepare pnpm@latest --activate
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}[错误] pnpm 安装失败${NC}"
        exit 1
    fi
fi
echo "   pnpm: $(pnpm -v)"

# ── 3. Docker ──────────────────────────────────
echo "[3/6] 检查 Docker..."
if ! docker ps &> /dev/null; then
    echo -e "${RED}[错误] Docker 未运行！请先启动 Docker Desktop${NC}"
    echo "   下载: https://www.docker.com/products/docker-desktop/"
    exit 1
fi
echo "   Docker 运行中"

# ── 4. 安装依赖 ────────────────────────────────
echo "[4/6] 安装依赖..."
pnpm install
echo "   依赖安装完成"

# ── 5. 环境变量 ────────────────────────────────
echo "[5/6] 配置环境变量..."
if [ ! -f "apps/api/.env" ]; then
    cp .env.example apps/api/.env
    echo -e "${YELLOW}[警告] 已创建 apps/api/.env，请编辑修改 JWT_SECRET！${NC}"
    echo -e "${YELLOW}   文件: apps/api/.env${NC}"
    echo -e "${YELLOW}   请将 JWT_SECRET=change-me-in-production 改为随机字符串${NC}"
    echo ""
    read -p "修改完成后按回车继续..."
else
    echo "   .env 已存在，跳过"
fi

# ── 6. 启动服务 ────────────────────────────────
echo "[6/6] 启动 PostgreSQL + 初始化数据库..."
docker compose up -d postgres
echo "   等待 PostgreSQL 就绪..."
sleep 5

echo "   初始化数据库..."
pnpm db:push
echo "   数据库初始化完成"

echo ""
echo "========================================"
echo -e "  ${GREEN}安装完成！${NC}"
echo "  启动开发服务器: pnpm dev"
echo "  访问: http://localhost:3001"
echo "  API 文档: http://localhost:3000/docs"
echo "========================================"
echo ""
read -p "按回车启动开发服务器..." -r
pnpm dev
