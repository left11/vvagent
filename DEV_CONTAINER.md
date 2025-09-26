# 🐳 开发容器部署指南

无需构建镜像，直接在容器中运行项目！

## 🚀 超简单部署（3步搞定）

### 在服务器上执行

```bash
# 1. 拉取代码
git clone -b docker your-repo-url tiktok-analyzer
cd tiktok-analyzer

# 2. 启动容器
docker-compose -f docker-compose.dev.yml up -d

# 3. 进入容器运行
docker exec -it tiktok-dev sh
npm install
npm run dev
```

访问 http://your-server:3000 即可！

## 📦 容器配置说明

### 使用的镜像
- **基础镜像**: `node:22-alpine` (官方 Node.js 22 镜像)
- **预装软件**: 
  - FFmpeg (视频处理)
  - Chromium (Puppeteer 支持)
  - 所有必要的系统库

### 挂载说明
- **项目代码**: 直接挂载当前目录到 `/app`
- **实时同步**: 修改代码立即生效，无需重建
- **独立 node_modules**: 容器内独立管理，避免冲突

## 🔧 详细使用方法

### 方式 1：使用启动脚本（推荐）

```bash
# 赋予执行权限
chmod +x scripts/docker-dev-run.sh

# 运行脚本
./scripts/docker-dev-run.sh
```

### 方式 2：手动操作

#### 启动容器
```bash
# 启动并保持运行
docker-compose -f docker-compose.dev.yml up -d

# 查看容器状态
docker ps
```

#### 进入容器
```bash
# 进入交互式 shell
docker exec -it tiktok-dev sh

# 现在你在容器内了，可以执行：
pwd                    # 显示 /app
ls -la                 # 查看项目文件
ffmpeg -version        # 确认 FFmpeg 已安装
node -v                # 显示 v22.x.x
npm -v                 # 显示 npm 版本
```

#### 在容器内运行项目
```bash
# 首次运行，安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 或生产模式
npm run build
npm start
```

## 📝 常用命令

### 容器管理
```bash
# 启动容器
docker-compose -f docker-compose.dev.yml up -d

# 停止容器
docker-compose -f docker-compose.dev.yml down

# 重启容器
docker-compose -f docker-compose.dev.yml restart

# 查看日志
docker logs -f tiktok-dev
```

### 在容器内执行命令
```bash
# 安装新的 npm 包
docker exec -it tiktok-dev npm install package-name

# 运行测试
docker exec -it tiktok-dev npm test

# 构建项目
docker exec -it tiktok-dev npm run build
```

### 调试命令
```bash
# 检查 FFmpeg
docker exec -it tiktok-dev ffmpeg -version

# 检查环境变量
docker exec -it tiktok-dev env

# 查看进程
docker exec -it tiktok-dev ps aux
```

## 🛠 环境变量配置

环境变量已在 `docker-compose.dev.yml` 中配置：

```yaml
environment:
  - NODE_ENV=development
  - GCS_BUCKET_NAME=public-test-bucket-2025
  - VERTEX_PROJECT_ID=public-service-220606
  # ... 其他配置
```

如需修改，编辑 `docker-compose.dev.yml` 后重启容器。

## ⚠️ 注意事项

1. **Service Account 文件**
   - 确保 `config/service-account.json` 存在
   - 文件会自动挂载到容器

2. **端口映射**
   - 容器内部: 3000
   - 主机访问: 3000
   - 如端口冲突，修改 `docker-compose.dev.yml` 中的端口

3. **node_modules**
   - 使用匿名卷，容器内独立管理
   - 不会与主机的 node_modules 冲突
   - 每次重建容器需重新 `npm install`

## 🔍 故障排查

### 容器无法启动
```bash
# 查看详细日志
docker-compose -f docker-compose.dev.yml logs

# 检查 Docker 版本
docker --version
```

### npm install 失败
```bash
# 清理并重试
docker exec -it tiktok-dev sh -c "rm -rf node_modules package-lock.json && npm install"
```

### FFmpeg 相关错误
```bash
# 验证 FFmpeg 安装
docker exec -it tiktok-dev which ffmpeg
docker exec -it tiktok-dev ffprobe -version
```

### 权限问题
```bash
# 修复文件权限
docker exec -it tiktok-dev chown -R node:node /app
```

## 💡 高级技巧

### 使用 PM2 在容器内管理进程
```bash
# 在容器内安装 PM2
docker exec -it tiktok-dev npm install -g pm2

# 使用 PM2 启动
docker exec -it tiktok-dev pm2 start npm -- start
docker exec -it tiktok-dev pm2 logs
```

### 保持容器内的 npm 缓存
```yaml
# 在 docker-compose.dev.yml 中已配置
volumes:
  - ~/.npm:/root/.npm  # npm 缓存持久化
```

### 使用不同的 Node 版本
```yaml
# 修改 docker-compose.dev.yml
image: node:20-alpine  # 使用 Node 20
image: node:18-alpine  # 使用 Node 18
```

## 🎯 快速命令参考

```bash
# 一键启动并进入容器
docker-compose -f docker-compose.dev.yml up -d && docker exec -it tiktok-dev sh

# 一键停止并清理
docker-compose -f docker-compose.dev.yml down -v

# 重启并查看日志
docker-compose -f docker-compose.dev.yml restart && docker logs -f tiktok-dev
```

## ✅ 优势

1. **无需构建镜像** - 直接使用官方 Node 镜像
2. **实时代码同步** - 修改立即生效
3. **环境隔离** - 不影响主机系统
4. **版本灵活** - 随时切换 Node 版本
5. **调试方便** - 可直接进入容器操作

这是最简单的部署方式，特别适合开发和测试！