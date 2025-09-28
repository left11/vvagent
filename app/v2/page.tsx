'use client';

import { useState } from 'react';
import { Send, Download, Copy, Check, Loader2 } from 'lucide-react';

// 支持的平台类型
type Platform = 'tiktok' | 'douyin' | 'youtube' | 'instagram' | 'bilibili' | 'unknown';

// 解析结果
interface ParseResult {
  success: boolean;
  platform: Platform;
  videoUrl?: string;  // 无水印视频链接
  coverUrl?: string;  // 封面图
  title?: string;
  author?: string;
  duration?: number;
  formats?: Array<{  // 多质量格式（YouTube等）
    quality: string;
    url: string;
    size?: number;
  }>;
  metadata?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  error?: string;
}

export default function V2Page() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [copied, setCopied] = useState(false);

  // 识别平台
  const detectPlatform = (url: string): Platform => {
    if (url.includes('tiktok.com') || url.includes('vt.tiktok.com')) return 'tiktok';
    if (url.includes('douyin.com') || url.includes('iesdouyin.com') || url.includes('抖音')) return 'douyin';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('bilibili.com') || url.includes('b23.tv')) return 'bilibili';
    return 'unknown';
  };

  // 解析视频
  const handleParse = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/v2/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        platform: 'unknown',
        error: '解析失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 复制链接
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 平台图标和颜色
  const platformConfig = {
    tiktok: { name: 'TikTok', color: 'bg-black', emoji: '🎵' },
    douyin: { name: '抖音', color: 'bg-black', emoji: '🎭' },
    youtube: { name: 'YouTube', color: 'bg-red-600', emoji: '📺' },
    instagram: { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', emoji: '📷' },
    bilibili: { name: 'B站', color: 'bg-blue-500', emoji: '🎬' },
    unknown: { name: '未知', color: 'bg-gray-500', emoji: '❓' }
  };

  const detectedPlatform = detectPlatform(input);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 标题 */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            多平台视频解析 V2
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            支持抖音、TikTok、YouTube、Instagram、B站等平台
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {Object.entries(platformConfig).map(([key, config]) => (
              <span key={key} className="text-2xl" title={config.name}>
                {config.emoji}
              </span>
            ))}
          </div>
        </header>

        {/* 输入区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleParse()}
              placeholder="粘贴视频链接或分享文本..."
              className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleParse}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* 平台检测提示 */}
          {input && !loading && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-500">检测到平台：</span>
              <span className={`px-2 py-1 rounded text-white ${platformConfig[detectedPlatform].color}`}>
                {platformConfig[detectedPlatform].emoji} {platformConfig[detectedPlatform].name}
              </span>
            </div>
          )}
        </div>

        {/* 解析结果 */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {result.success ? (
              <div className="space-y-4">
                {/* 平台和标题 */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded text-white text-sm ${platformConfig[result.platform].color}`}>
                        {platformConfig[result.platform].emoji} {platformConfig[result.platform].name}
                      </span>
                    </div>
                    {result.title && (
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.title}
                      </h3>
                    )}
                    {result.author && (
                      <p className="text-gray-600 dark:text-gray-400">
                        作者：{result.author}
                      </p>
                    )}
                  </div>
                  {result.coverUrl && (
                    <img 
                      src={result.coverUrl} 
                      alt="封面"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                </div>

                {/* 视频信息 */}
                {result.metadata && (
                  <div className="grid grid-cols-4 gap-2 py-3 border-y border-gray-200 dark:border-gray-700">
                    {result.metadata.views && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(result.metadata.views / 10000).toFixed(1)}w
                        </div>
                        <div className="text-xs text-gray-500">播放</div>
                      </div>
                    )}
                    {result.metadata.likes && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(result.metadata.likes / 10000).toFixed(1)}w
                        </div>
                        <div className="text-xs text-gray-500">点赞</div>
                      </div>
                    )}
                    {result.metadata.comments && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(result.metadata.comments / 10000).toFixed(1)}w
                        </div>
                        <div className="text-xs text-gray-500">评论</div>
                      </div>
                    )}
                    {result.metadata.shares && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {(result.metadata.shares / 10000).toFixed(1)}w
                        </div>
                        <div className="text-xs text-gray-500">分享</div>
                      </div>
                    )}
                  </div>
                )}

                {/* 视频链接和下载 */}
                {result.videoUrl && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      无水印视频链接
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={result.videoUrl}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={() => copyToClipboard(result.videoUrl!)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            复制
                          </>
                        )}
                      </button>
                      <a
                        href={result.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        下载视频
                      </a>
                    </div>
                  </div>
                )}

                {/* 多质量格式（YouTube等） */}
                {result.formats && result.formats.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      可选视频质量
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {result.formats.map((format, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm font-medium">{format.quality}</span>
                          {format.size && (
                            <span className="text-xs text-gray-500">
                              {(format.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          )}
                          <a
                            href={format.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors"
                          >
                            打开
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-red-500 text-lg mb-2">解析失败</div>
                <p className="text-gray-600 dark:text-gray-400">
                  {result.error || '无法解析该链接，请检查链接是否正确'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 说明 */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>仅用于解析公开视频链接，不下载、不存储、不分析</p>
          <p className="mt-2">支持直接粘贴分享文本，自动识别链接</p>
        </div>
      </main>
    </div>
  );
}