module.exports = {
  apps: [{
    name: 'tiktok-analyzer',
    script: 'npm',
    args: 'start',
    cwd: './',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 环境变量
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      // 从 .env.production 文件加载其他环境变量
    },
    
    // 崩溃重启策略
    min_uptime: '10s',
    max_restarts: 10,
    
    // 优雅关闭
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // 监控配置
    instance_var: 'INSTANCE_ID',
    
    // 错误处理
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    
    // 进程监控
    monitoring: true,
    
    // Node.js 参数
    node_args: '--max-old-space-size=4096',
    
    // 解释器参数
    interpreter_args: '',
    
    // 应用启动后的健康检查
    health_check: {
      interval: 30,
      timeout: 5000,
      max_consecutive_failures: 3,
      path: '/api/health'
    }
  }],
  
  // 部署配置（可选）
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/tiktok-video-analyzer.git',
      path: '/var/www/tiktok-analyzer',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'echo "Starting deployment setup"',
      'post-setup': 'echo "Deployment setup completed"'
    }
  }
};