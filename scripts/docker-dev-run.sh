#!/bin/bash

# 开发容器快速启动脚本
# 使用 Node.js 22 + FFmpeg，直接挂载项目代码

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}    开发容器启动脚本 (Node.js 22 + FFmpeg)${NC}"
echo -e "${BLUE}================================================${NC}"

# 检查 Docker
echo -e "\n${YELLOW}检查 Docker 状态...${NC}"
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 停止旧容器（如果存在）
if docker ps -a | grep -q tiktok-dev; then
    echo -e "${YELLOW}停止旧容器...${NC}"
    docker stop tiktok-dev 2>/dev/null || true
    docker rm tiktok-dev 2>/dev/null || true
fi

# 启动容器
echo -e "\n${YELLOW}启动开发容器...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# 等待容器启动
sleep 3

# 安装依赖
echo -e "\n${YELLOW}安装项目依赖...${NC}"
docker exec -it tiktok-dev sh -c "npm install"

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✅ 容器已启动！${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n${YELLOW}使用方法：${NC}"
echo -e "${BLUE}1. 进入容器：${NC}"
echo "   docker exec -it tiktok-dev sh"
echo ""
echo -e "${BLUE}2. 在容器内运行项目：${NC}"
echo "   npm run dev        # 开发模式"
echo "   npm run build      # 构建"
echo "   npm start          # 生产模式"
echo ""
echo -e "${BLUE}3. 查看日志：${NC}"
echo "   docker logs -f tiktok-dev"
echo ""
echo -e "${BLUE}4. 停止容器：${NC}"
echo "   docker-compose -f docker-compose.dev.yml down"
echo ""
echo -e "${GREEN}应用地址: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}提示：${NC}"
echo "• 代码修改会实时同步到容器"
echo "• FFmpeg 已预装在容器中"
echo "• node_modules 在容器内独立管理"