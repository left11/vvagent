# 生产环境部署指南

## 快速部署（使用 PM2）

### 1. 服务器准备

```bash
# 更新系统包
sudo apt-get update
sudo apt-get upgrade -y

# 安装必要的系统依赖
sudo apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    ffmpeg

# 安装 Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v  # 应显示 v20.x.x
npm -v   # 应显示 10.x.x
ffmpeg -version  # 应显示 FFmpeg 版本信息
```

### 2. 项目部署

```bash
# 创建应用目录
sudo mkdir -p /var/www
cd /var/www

# 克隆项目（或上传代码）
git clone <your-repo-url> tiktok-analyzer
cd tiktok-analyzer

# 设置权限
sudo chown -R $USER:$USER /var/www/tiktok-analyzer

# 安装依赖
npm ci --production

# 创建环境配置
cp .env.example .env.production
vim .env.production  # 编辑配置文件
```

### 3. 配置 Service Account

```bash
# 创建配置目录
mkdir -p config

# 上传 Service Account JSON 文件
# 使用 SCP 或其他方法上传文件到 config/ 目录
scp /path/to/service-account.json user@server:/var/www/tiktok-analyzer/config/

# 设置安全权限
chmod 600 config/*.json
```

### 4. 使用启动脚本

```bash
# 赋予执行权限
chmod +x scripts/start-prod.sh

# 运行启动脚本
./scripts/start-prod.sh
```

## 手动部署（使用 PM2）

```bash
# 安装 PM2
npm install -g pm2

# 构建项目
npm run build

# 使用 PM2 配置文件启动
pm2 start ecosystem.config.js --env production

# 保存 PM2 进程列表
pm2 save

# 设置开机自启
pm2 startup systemd
# 按提示执行生成的命令
```

## 使用 Systemd 部署（替代方案）

### 1. 复制 service 文件

```bash
# 复制 service 文件到 systemd 目录
sudo cp scripts/tiktok-analyzer.service /etc/systemd/system/

# 编辑 service 文件（根据实际路径调整）
sudo nano /etc/systemd/system/tiktok-analyzer.service
```

### 2. 创建日志目录

```bash
sudo mkdir -p /var/log/tiktok-analyzer
sudo chown $USER:$USER /var/log/tiktok-analyzer
```

### 3. 启动服务

```bash
# 重载 systemd 配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start tiktok-analyzer

# 设置开机自启
sudo systemctl enable tiktok-analyzer

# 查看服务状态
sudo systemctl status tiktok-analyzer

# 查看日志
sudo journalctl -u tiktok-analyzer -f
```

## Nginx 反向代理配置

### 1. 安装 Nginx

```bash
sudo apt-get install -y nginx
```

### 2. 创建站点配置

```nginx
# /etc/nginx/sites-available/tiktok-analyzer
server {
    listen 80;
    server_name your-domain.com;

    # 增大客户端请求体大小限制（视频上传）
    client_max_body_size 500M;
    
    # 增大超时时间（AI 分析可能需要时间）
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
    send_timeout 300;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE 支持
        proxy_set_header Cache-Control no-cache;
        proxy_buffering off;
    }
}
```

### 3. 启用站点

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/tiktok-analyzer /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## SSL 证书配置（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取并安装证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo systemctl enable certbot.timer
```

## 性能优化

### 1. 系统优化

```bash
# 编辑 /etc/sysctl.conf
sudo nano /etc/sysctl.conf

# 添加以下配置
net.core.somaxconn = 65535
net.ipv4.tcp_max_tw_buckets = 1440000
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15

# 应用配置
sudo sysctl -p
```

### 2. Node.js 优化

```bash
# 在启动脚本中设置
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
```

## 监控和维护

### PM2 监控命令

```bash
# 查看应用状态
pm2 status

# 查看详细信息
pm2 describe tiktok-analyzer

# 查看实时日志
pm2 logs tiktok-analyzer

# 监控面板
pm2 monit

# 查看内存和 CPU 使用
pm2 show tiktok-analyzer
```

### 日志管理

```bash
# PM2 日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# 查看日志位置
pm2 info tiktok-analyzer | grep "log path"
```

### 备份策略

```bash
# 创建备份脚本
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/tiktok-analyzer"
mkdir -p $BACKUP_DIR

# 备份配置文件
tar -czf $BACKUP_DIR/config-$(date +%Y%m%d).tar.gz \
    /var/www/tiktok-analyzer/.env.production \
    /var/www/tiktok-analyzer/config/

# 备份数据库（如果有）
# pg_dump database_name > $BACKUP_DIR/db-$(date +%Y%m%d).sql

# 删除 30 天前的备份
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

# 设置定时任务
crontab -e
# 添加: 0 3 * * * /home/ubuntu/backup.sh
```

## 故障排查

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   sudo lsof -i :3000
   # 或
   sudo netstat -tulpn | grep :3000
   ```

2. **内存不足**
   ```bash
   # 查看内存使用
   free -h
   # 增加 swap
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

3. **权限问题**
   ```bash
   # 检查文件权限
   ls -la /var/www/tiktok-analyzer
   # 修复权限
   sudo chown -R $USER:$USER /var/www/tiktok-analyzer
   ```

4. **Service Account 认证失败**
   ```bash
   # 验证 Service Account 文件
   cat config/service-account.json | jq .project_id
   # 检查环境变量
   pm2 env 0 | grep GOOGLE
   ```

## 安全建议

1. **防火墙配置**
   ```bash
   sudo ufw allow 22/tcp  # SSH
   sudo ufw allow 80/tcp  # HTTP
   sudo ufw allow 443/tcp # HTTPS
   sudo ufw enable
   ```

2. **限制 SSH 访问**
   ```bash
   # 编辑 /etc/ssh/sshd_config
   PermitRootLogin no
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```

3. **定期更新**
   ```bash
   # 自动安全更新
   sudo apt-get install unattended-upgrades
   sudo dpkg-reconfigure unattended-upgrades
   ```

4. **监控异常**
   ```bash
   # 安装 fail2ban
   sudo apt-get install fail2ban
   ```

## 联系支持

如遇到问题，请提供以下信息：
- PM2 日志：`pm2 logs tiktok-analyzer --lines 100`
- 系统信息：`uname -a && node -v && npm -v`
- 错误截图和描述