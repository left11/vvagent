#!/bin/bash

# Docker 部署脚本 - 适用于 CentOS 7
# 解决 Node.js 18+ 不兼容问题

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}    TikTok Analyzer - Docker 部署脚本${NC}"
echo -e "${BLUE}    适用于: CentOS 7 / RHEL 7${NC}"
echo -e "${BLUE}================================================${NC}"

# 检查是否为 root 或具有 sudo 权限
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then 
   echo -e "${RED}请使用 root 用户运行或配置 sudo 权限${NC}"
   exit 1
fi

# 函数：运行命令（自动添加 sudo）
run_cmd() {
    if [ "$EUID" -eq 0 ]; then
        $@
    else
        sudo $@
    fi
}

# 步骤 1: 安装 Docker（如果未安装）
echo -e "\n${YELLOW}[1/6] 检查 Docker 安装状态...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker 未安装，开始安装...${NC}"
    
    # 卸载旧版本
    run_cmd yum remove -y docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
    
    # 安装依赖
    run_cmd yum install -y yum-utils device-mapper-persistent-data lvm2
    
    # 添加 Docker 仓库
    run_cmd yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    
    # 安装 Docker CE
    run_cmd yum install -y docker-ce docker-ce-cli containerd.io
    
    # 启动 Docker
    run_cmd systemctl start docker
    run_cmd systemctl enable docker
    
    echo -e "${GREEN}✅ Docker 安装成功${NC}"
else
    echo -e "${GREEN}✅ Docker 已安装: $(docker --version)${NC}"
fi

# 步骤 2: 安装 Docker Compose（如果未安装）
echo -e "\n${YELLOW}[2/6] 检查 Docker Compose 安装状态...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose 未安装，开始安装...${NC}"
    
    # 下载 Docker Compose
    run_cmd curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    run_cmd chmod +x /usr/local/bin/docker-compose
    
    # 创建软链接
    run_cmd ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    echo -e "${GREEN}✅ Docker Compose 安装成功${NC}"
else
    echo -e "${GREEN}✅ Docker Compose 已安装: $(docker-compose --version)${NC}"
fi

# 步骤 3: 准备项目文件
echo -e "\n${YELLOW}[3/6] 准备项目文件...${NC}"

# 检查当前目录是否为项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 创建必要的目录
echo -e "${YELLOW}创建必要目录...${NC}"
mkdir -p config logs /tmp/tiktok-videos
chmod 777 /tmp/tiktok-videos

# 检查 Service Account 文件
echo -e "${YELLOW}检查 Service Account 配置...${NC}"
if [ ! -f "config/service-account.json" ] && [ ! -f "config/public-service-220606-0ce909493107.json" ]; then
    echo -e "${RED}⚠️  警告: Service Account 文件未找到${NC}"
    echo -e "${YELLOW}请将 Service Account JSON 文件放置在 ./config/ 目录${NC}"
    echo -e "${YELLOW}例如: cp /path/to/service-account.json ./config/${NC}"
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Service Account 文件已找到${NC}"
fi

# 检查环境变量文件
echo -e "${YELLOW}检查环境变量配置...${NC}"
if [ ! -f ".env.production" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}创建 .env.production 文件...${NC}"
        cp .env.example .env.production
        echo -e "${YELLOW}请编辑 .env.production 文件配置必要的环境变量${NC}"
        read -p "是否现在编辑？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            vi .env.production
        fi
    else
        echo -e "${RED}⚠️  警告: .env.production 文件不存在${NC}"
    fi
else
    echo -e "${GREEN}✅ 环境变量文件已找到${NC}"
fi

# 更新 Next.js 配置以支持 standalone 输出
echo -e "\n${YELLOW}[4/6] 检查 Next.js 配置...${NC}"
if [ -f "next.config.js" ]; then
    if ! grep -q "output.*:.*'standalone'" next.config.js; then
        echo -e "${YELLOW}更新 next.config.js 以支持 Docker...${NC}"
        # 备份原文件
        cp next.config.js next.config.js.backup
        # 这里需要手动添加 output: 'standalone'
        echo -e "${YELLOW}请手动在 next.config.js 中添加: output: 'standalone'${NC}"
        echo -e "${YELLOW}示例:${NC}"
        echo -e "${GREEN}module.exports = {"
        echo -e "  output: 'standalone',"
        echo -e "  // ... 其他配置"
        echo -e "}${NC}"
        read -p "配置完成后按任意键继续..."
    fi
fi

# 步骤 5: 构建和启动容器
echo -e "\n${YELLOW}[5/6] 构建 Docker 镜像...${NC}"

# 停止现有容器（如果存在）
if [ "$(docker ps -aq -f name=tiktok-analyzer)" ]; then
    echo -e "${YELLOW}停止现有容器...${NC}"
    docker stop tiktok-analyzer 2>/dev/null || true
    docker rm tiktok-analyzer 2>/dev/null || true
fi

# 构建镜像
echo -e "${YELLOW}开始构建 Docker 镜像...${NC}"
docker-compose build --no-cache

# 步骤 6: 启动服务
echo -e "\n${YELLOW}[6/6] 启动服务...${NC}"
docker-compose up -d

# 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 5

# 检查服务状态
if docker ps | grep -q tiktok-analyzer; then
    echo -e "${GREEN}✅ 服务启动成功！${NC}"
    
    # 显示容器信息
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${GREEN}部署成功！${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    echo -e "\n${YELLOW}服务信息:${NC}"
    echo -e "  应用地址: ${GREEN}http://$(hostname -I | awk '{print $1}'):3000${NC}"
    echo -e "  容器名称: ${GREEN}tiktok-analyzer${NC}"
    echo -e "  容器状态: ${GREEN}$(docker ps --filter name=tiktok-analyzer --format 'table {{.Status}}' | tail -n 1)${NC}"
    
    echo -e "\n${YELLOW}常用命令:${NC}"
    echo -e "  查看日志: ${BLUE}docker-compose logs -f${NC}"
    echo -e "  重启服务: ${BLUE}docker-compose restart${NC}"
    echo -e "  停止服务: ${BLUE}docker-compose down${NC}"
    echo -e "  查看状态: ${BLUE}docker-compose ps${NC}"
    echo -e "  进入容器: ${BLUE}docker exec -it tiktok-analyzer sh${NC}"
    
    echo -e "\n${YELLOW}故障排查:${NC}"
    echo -e "  如果服务无法访问，请检查:"
    echo -e "  1. 防火墙设置: ${BLUE}firewall-cmd --add-port=3000/tcp --permanent && firewall-cmd --reload${NC}"
    echo -e "  2. SELinux 设置: ${BLUE}setenforce 0${NC} (临时禁用)"
    echo -e "  3. 查看容器日志: ${BLUE}docker-compose logs${NC}"
    
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    echo -e "${YELLOW}请查看日志: docker-compose logs${NC}"
    exit 1
fi

# 设置开机自启（可选）
echo -e "\n${YELLOW}是否设置开机自启？(y/n)${NC}"
read -p "" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 创建 systemd 服务
    cat > /tmp/docker-tiktok-analyzer.service <<EOF
[Unit]
Description=TikTok Analyzer Docker Container
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    run_cmd mv /tmp/docker-tiktok-analyzer.service /etc/systemd/system/
    run_cmd systemctl daemon-reload
    run_cmd systemctl enable docker-tiktok-analyzer.service
    
    echo -e "${GREEN}✅ 开机自启设置成功${NC}"
fi

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}        部署完成！祝使用愉快！${NC}"
echo -e "${GREEN}================================================${NC}"