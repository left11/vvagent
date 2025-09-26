# 抖音/TikTok 爆款视频 AI 分析系统

基于 Gemini 2.5 Pro 的专业短视频分析平台，提供10维度深度分析，助力创作者理解爆款密码。

## 🚀 核心功能

### 视频处理能力
- ✅ **智能链接解析**：支持抖音/TikTok分享链接、口令文本
- ✅ **无水印下载**：自动去除视频水印（playwm → play）
- ✅ **云端存储**：Google Cloud Storage 自动上传与去重（MD5）
- ✅ **时长检测**：FFmpeg 精确识别视频时长
- ✅ **实时进度**：Server-Sent Events 流式状态更新

### AI 分析维度（基于 Gemini 2.5 Pro）
1. **时间轴分析**：逐秒拆解视频节奏与转折点
2. **文案钩子**：开场3秒黄金法则评估
3. **视觉焦点**：画面构图、色彩、运镜分析
4. **音频节奏**：BPM、剪辑节奏、音画同步度
5. **情绪曲线**：观众情绪触发点识别
6. **用户画像**：目标受众精准定位
7. **平台算法**：标签、话题、流量机制解析
8. **商业价值**：带货转化、品牌植入评估
9. **竞品对标**：同类爆款对比分析
10. **优化建议**：可执行的改进方案

## 🛠 技术架构

### 前端技术栈
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS 3.x
- **组件**: React 18 + Lucide Icons
- **状态**: React Hooks

### 后端技术栈
- **运行时**: Node.js 18+
- **AI模型**: Google Gemini 2.5 Pro (Vertex AI)
- **存储**: Google Cloud Storage
- **视频处理**: FFmpeg + Puppeteer
- **认证**: Service Account (非 API Key)

## 📦 项目结构

```bash
tiktok-video-analyzer/
├── app/                      # Next.js App Router
│   ├── api/analyze/         # 视频分析 API 端点
│   ├── components/          # React 组件
│   └── page.tsx            # 主页面
├── lib/
│   ├── services/           # 核心服务
│   │   ├── tiktok-parser.ts       # 链接解析
│   │   ├── video-downloader.ts    # 视频下载
│   │   ├── gcs-service.ts         # GCS 上传
│   │   └── gemini-vertex-analyzer.ts  # AI 分析
│   ├── types/              # TypeScript 类型定义
│   └── utils/              # 工具函数
│       ├── validation.ts   # 输入验证
│       ├── format.ts       # 格式化工具
│       └── video-info.ts   # FFmpeg 集成
├── components/ui/          # UI 组件库
│   └── ResultDisplay/      # 分析结果展示
├── config/                 # 配置文件
│   └── *.json             # Service Account 凭证
├── prompt/                 # AI 提示词模板
│   └── video_analyze.md    # 10维度分析模板
└── scripts/               # 部署脚本
    ├── start-prod.sh      # 生产环境启动
    └── ecosystem.config.js # PM2 配置

## ⚙️ 环境要求

### 系统依赖
- **Node.js**: 18.0+ (推荐 20.x LTS)
- **FFmpeg**: 必需，用于视频时长检测
- **PM2**: 生产环境进程管理（可选）

### Google Cloud 配置
1. **Service Account**: 需要 Vertex AI 权限
2. **Cloud Storage Bucket**: 公开读权限的存储桶
3. **项目配置**:
   - Project ID: `public-service-220606`
   - Location: `us-central1`
   - Model: `gemini-2.5-pro`

## 📝 快速部署

### 1. 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd tiktok-video-analyzer

# 安装 Node 依赖
npm install

# 安装系统依赖（Ubuntu/Debian）
sudo apt-get update
sudo apt-get install -y ffmpeg

# 安装 PM2（生产环境）
npm install -g pm2
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.production

# 编辑配置（必需）
vim .env.production
```

必需的环境变量：
```env
# Google Cloud Storage
GCS_BUCKET_NAME=your-bucket-name
GCS_KEY_FILE=./config/service-account.json

# Vertex AI (Gemini)
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account.json
VERTEX_PROJECT_ID=public-service-220606
VERTEX_LOCATION=us-central1

# 应用配置
NODE_ENV=production
PORT=3000
```

### 3. 配置 Service Account

```bash
# 创建配置目录
mkdir -p config

# 复制 Service Account JSON 文件
cp /path/to/service-account.json config/

# 设置权限
chmod 600 config/*.json
```

## 🚀 启动应用

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 访问地址
http://localhost:3000
```

### 生产环境（使用 PM2）

```bash
# 构建生产版本
npm run build

# 使用启动脚本
chmod +x scripts/start-prod.sh
./scripts/start-prod.sh

# 或直接使用 PM2
pm2 start ecosystem.config.js --env production

# 查看运行状态
pm2 status
pm2 logs tiktok-analyzer

# 重启服务
pm2 restart tiktok-analyzer

# 停止服务
pm2 stop tiktok-analyzer
```

### 生产环境（使用 systemd）

```bash
# 创建 systemd 服务文件
sudo nano /etc/systemd/system/tiktok-analyzer.service

# 启动服务
sudo systemctl start tiktok-analyzer
sudo systemctl enable tiktok-analyzer

# 查看状态
sudo systemctl status tiktok-analyzer
journalctl -u tiktok-analyzer -f
```

## 📊 性能指标

- **视频解析**: < 2秒
- **下载速度**: 10-50 MB/s（取决于网络）
- **GCS 上传**: 5-20 MB/s
- **AI 分析**: 15-30秒（5分钟视频）
- **并发处理**: 10+ 视频同时分析

## 🔧 故障排查

### 常见问题

1. **FFmpeg 未找到**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   
   # macOS
   brew install ffmpeg
   ```

2. **Service Account 权限错误**
   - 确认已启用 Vertex AI API
   - 检查 Service Account 角色：需要 `Vertex AI User`
   - 验证项目 ID 和区域设置

3. **视频下载失败**
   - 检查网络连接
   - 确认链接格式正确
   - 查看 Puppeteer 依赖

4. **超时错误**
   - 增加 `VIDEO_DOWNLOAD_TIMEOUT` 环境变量
   - 检查视频文件大小限制

## 📈 监控与日志

### PM2 监控
```bash
# 实时监控
pm2 monit

# 查看日志
pm2 logs tiktok-analyzer --lines 100

# 性能指标
pm2 describe tiktok-analyzer
```

### 日志文件位置
- PM2 日志: `~/.pm2/logs/`
- 应用日志: `./logs/` (如配置)
- systemd 日志: `journalctl -u tiktok-analyzer`

## 🔒 安全建议

1. **凭证管理**
   - 永远不要提交 Service Account JSON 到代码库
   - 使用环境变量或密钥管理服务
   - 定期轮换凭证

2. **访问控制**
   - 配置防火墙规则
   - 使用反向代理（Nginx）
   - 启用 HTTPS

3. **资源限制**
   - 设置请求速率限制
   - 配置文件大小限制
   - 实施队列系统防止过载

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- 技术支持：[邮箱地址]
- 项目主页：[GitHub URL]
