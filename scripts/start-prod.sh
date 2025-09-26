#!/bin/bash

# 抖音视频分析器 - 生产环境启动脚本
# Production startup script for TikTok Video Analyzer

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  TikTok Video Analyzer - Production${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查必要的系统依赖
echo -e "\n${YELLOW}检查系统依赖...${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js 版本: $NODE_VERSION${NC}"

# 检查 FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ FFmpeg 未安装，请执行: sudo apt-get install ffmpeg${NC}"
    exit 1
fi
echo -e "${GREEN}✅ FFmpeg 已安装${NC}"

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 未安装，正在安装...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✅ PM2 已安装${NC}"

# 设置工作目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo -e "\n${YELLOW}工作目录: $PROJECT_DIR${NC}"

# 检查环境变量文件
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production 文件不存在${NC}"
    echo -e "${YELLOW}请先创建 .env.production 文件并配置必要的环境变量${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 环境变量文件已找到${NC}"

# 检查 Service Account 文件
if [ ! -f "config/service-account.json" ] && [ ! -f "config/public-service-220606-0ce909493107.json" ]; then
    echo -e "${RED}❌ Service Account JSON 文件未找到${NC}"
    echo -e "${YELLOW}请将 Service Account 文件放置在 config/ 目录下${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Service Account 文件已找到${NC}"

# 检查并安装依赖
echo -e "\n${YELLOW}检查 Node.js 依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装依赖包...${NC}"
    npm install --production
fi

# 构建项目
echo -e "\n${YELLOW}构建生产版本...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 构建成功${NC}"

# 创建日志目录
mkdir -p logs

# 使用 PM2 启动应用
echo -e "\n${YELLOW}启动应用服务...${NC}"

# 停止现有实例（如果存在）
pm2 stop tiktok-analyzer 2>/dev/null
pm2 delete tiktok-analyzer 2>/dev/null

# 启动新实例
if [ -f "ecosystem.config.js" ]; then
    # 使用 PM2 配置文件
    pm2 start ecosystem.config.js --env production
else
    # 直接启动
    pm2 start npm --name "tiktok-analyzer" -- start -- --port 3000
fi

# 保存 PM2 配置
pm2 save

# 设置开机自启
echo -e "\n${YELLOW}配置开机自启...${NC}"
pm2 startup systemd -u $(whoami) --hp /home/$(whoami) 2>/dev/null

# 显示状态
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 应用已成功启动！${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}查看状态:${NC}"
echo "  pm2 status"
echo ""
echo -e "${YELLOW}查看日志:${NC}"
echo "  pm2 logs tiktok-analyzer"
echo ""
echo -e "${YELLOW}监控面板:${NC}"
echo "  pm2 monit"
echo ""
echo -e "${YELLOW}重启服务:${NC}"
echo "  pm2 restart tiktok-analyzer"
echo ""
echo -e "${YELLOW}停止服务:${NC}"
echo "  pm2 stop tiktok-analyzer"
echo ""
echo -e "${GREEN}应用地址: http://localhost:3000${NC}"

# 显示当前状态
pm2 list