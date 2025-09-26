# Docker 部署指南（CentOS 7）

本指南专为 CentOS 7 等不支持 Node.js 18+ 的系统设计，使用 Docker 容器化部署。

## 🚀 快速开始

### 在服务器上执行

```bash
# 1. 上传代码到服务器
scp -r ./tiktok-video-analyzer user@server:/var/www/

# 2. 登录服务器
ssh user@server

# 3. 进入项目目录
cd /var/www/tiktok-video-analyzer

# 4. 运行部署脚本
chmod +x scripts/docker-deploy.sh
./scripts/docker-deploy.sh
```

## 📋 手动部署步骤

### 1. 安装 Docker（CentOS 7）

```bash
# 卸载旧版本
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 安装依赖
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker CE
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

### 2. 安装 Docker Compose

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 3. 准备配置文件

```bash
# 创建环境配置
cp .env.example .env.production
vim .env.production

# 必须的环境变量
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=public-service-220606
VERTEX_PROJECT_ID=public-service-220606
VERTEX_LOCATION=us-central1
```

### 4. 上传 Service Account 文件

```bash
# 创建配置目录
mkdir -p config

# 上传 Service Account JSON 文件
# 本地执行：
scp /path/to/service-account.json user@server:/var/www/tiktok-analyzer/config/

# 设置权限
chmod 600 config/*.json
```

### 5. 构建和启动

```bash
# 构建镜像
docker-compose build

# 启动服务（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 🔧 Docker 配置说明

### Dockerfile 特点

- **基础镜像**: Node.js 20 Alpine（轻量级）
- **内置依赖**: FFmpeg、Chromium（for Puppeteer）
- **多阶段构建**: 减小最终镜像大小
- **非 root 用户**: 提高安全性
- **健康检查**: 自动监控服务状态

### docker-compose.yml 配置

- **资源限制**: CPU 2核，内存 4GB
- **自动重启**: 服务崩溃后自动恢复
- **日志管理**: 限制日志文件大小
- **卷挂载**: 配置文件、日志持久化

## 📊 管理命令

### 基本操作

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 进入容器
docker exec -it tiktok-analyzer sh
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建
docker-compose build --no-cache

# 重启服务
docker-compose up -d
```

### 清理资源

```bash
# 停止并删除容器
docker-compose down

# 清理未使用的镜像
docker image prune -f

# 清理所有未使用资源
docker system prune -af
```

## 🔥 防火墙配置

### CentOS 7 (firewalld)

```bash
# 开放端口
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload

# 查看开放的端口
sudo firewall-cmd --list-ports
```

### SELinux 配置

```bash
# 临时禁用（测试用）
sudo setenforce 0

# 永久配置
sudo setsebool -P httpd_can_network_connect 1
```

## 🐛 故障排查

### 1. 容器无法启动

```bash
# 查看详细日志
docker-compose logs --tail=50

# 检查容器状态
docker ps -a

# 查看容器详情
docker inspect tiktok-analyzer
```

### 2. FFmpeg 相关错误

```bash
# 进入容器检查
docker exec -it tiktok-analyzer sh
ffmpeg -version
```

### 3. Service Account 认证失败

```bash
# 检查文件是否正确挂载
docker exec -it tiktok-analyzer ls -la /app/config/

# 查看环境变量
docker exec -it tiktok-analyzer env | grep GOOGLE
```

### 4. 内存不足

```bash
# 查看容器资源使用
docker stats tiktok-analyzer

# 调整 docker-compose.yml 中的内存限制
# limits:
#   memory: 6G  # 增加到 6GB
```

## 🔄 设置开机自启

### 使用 systemd

```bash
# 创建服务文件
sudo cat > /etc/systemd/system/docker-tiktok-analyzer.service <<EOF
[Unit]
Description=TikTok Analyzer Docker Container
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/tiktok-analyzer
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable docker-tiktok-analyzer
```

## 📝 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| GCS_BUCKET_NAME | Google Cloud Storage 桶名 | public-test-bucket-2025 |
| GCS_PROJECT_ID | GCP 项目 ID | public-service-220606 |
| VERTEX_PROJECT_ID | Vertex AI 项目 ID | public-service-220606 |
| VERTEX_LOCATION | Vertex AI 区域 | us-central1 |
| NODE_ENV | 运行环境 | production |
| PORT | 服务端口 | 3000 |
| MAX_VIDEO_SIZE_MB | 视频大小限制 | 500 |

## 🎯 性能优化

### 1. 构建优化

```dockerfile
# 使用 .dockerignore 减少构建上下文
# 多阶段构建减小镜像体积
# 使用 Alpine 基础镜像
```

### 2. 运行优化

```yaml
# docker-compose.yml 中设置
deploy:
  resources:
    limits:
      cpus: '4'      # 增加 CPU
      memory: 8G     # 增加内存
```

### 3. 网络优化

```bash
# 使用 host 网络模式（可选）
network_mode: host  # 在 docker-compose.yml 中
```

## 📞 支持

遇到问题时，请提供：
1. `docker-compose logs --tail=100` 的输出
2. `docker --version` 和 `docker-compose --version`
3. 系统信息：`cat /etc/centos-release`