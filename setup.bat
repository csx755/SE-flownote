@echo off
chcp 65001 >nul
echo ========================================
echo   FlowNote 一键安装脚本
echo ========================================
echo.

REM ── 1. 检查 Node.js ──────────────────────────
echo [1/6] 检查 Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 22+
    echo   下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=1,2,3 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%b
if %NODE_MAJOR% lss 22 (
    echo [错误] Node.js 版本过旧，需要 22+，当前:
    node -v
    pause
    exit /b 1
)
echo    Node.js 已安装:
node -v

REM ── 2. 检查 pnpm ─────────────────────────────
echo [2/6] 检查 pnpm...
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 未找到 pnpm，正在安装...
    corepack enable
    corepack prepare pnpm@latest --activate
    if %errorlevel% neq 0 (
        echo [错误] pnpm 安装失败，请手动安装: npm install -g pnpm
        pause
        exit /b 1
    )
)
echo    pnpm 已安装:
pnpm -v

REM ── 3. 检查 Docker ───────────────────────────
echo [3/6] 检查 Docker Desktop...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker Desktop 未启动！
    echo   请先启动 Docker Desktop（鲸鱼图标变绿），然后重试。
    echo   下载地址: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo    Docker 运行中

REM ── 4. 安装依赖 ─────────────────────────────
echo [4/6] 安装项目依赖...
pnpm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败，请检查网络连接后重试
    pause
    exit /b 1
)
echo    依赖安装完成

REM ── 5. 配置环境变量 ─────────────────────────
echo [5/6] 配置环境变量...
if not exist "apps\api\.env" (
    copy .env.example apps\api\.env >nul
    echo    [警告] 已创建 apps\api\.env，请编辑此文件修改 JWT_SECRET！
    echo    文件位置: apps\api\.env
    echo    请将 JWT_SECRET=change-me-in-production 改为随机字符串
    echo.
    echo    按任意键继续（请确保已修改 JWT_SECRET）...
    pause >nul
) else (
    echo    .env 已存在，跳过
)

REM ── 6. 启动服务 ─────────────────────────────
echo [6/6] 启动 PostgreSQL + 初始化数据库...
docker compose up -d postgres
if %errorlevel% neq 0 (
    echo [错误] PostgreSQL 启动失败
    pause
    exit /b 1
)
echo    等待 PostgreSQL 就绪...
timeout /t 5 /nobreak >nul

echo    初始化数据库...
pnpm db:push
if %errorlevel% neq 0 (
    echo [错误] 数据库初始化失败，请检查 apps\api\.env 中的 DATABASE_URL
    pause
    exit /b 1
)
echo    数据库初始化完成

echo.
echo ========================================
echo   安装完成！启动开发服务器:
echo   pnpm dev
echo.
echo   访问: http://localhost:3001
echo   API 文档: http://localhost:3000/docs
echo ========================================
echo.
echo   按任意键启动开发服务器...
pause >nul
pnpm dev
