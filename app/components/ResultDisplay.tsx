'use client';

import { AnalysisResult, ExportFormat } from '@/lib/types';
import { useState } from 'react';
import { GeminiResultDisplay } from '@/components/ui/ResultDisplay/GeminiResultDisplay';
import { formatDuration, formatFileSize } from '@/lib/utils/format';

interface ResultDisplayProps {
  analysisResult?: AnalysisResult;
  onExport: (format: ExportFormat) => void;
}

export default function ResultDisplay({ analysisResult, onExport }: ResultDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'recommendations'>('overview');
  const [exportDropdown, setExportDropdown] = useState(false);

  if (!analysisResult) {
    return null;
  }

  const { videoInfo, insights, recommendations, geminiAnalysis } = analysisResult;

  const tabs = [
    { id: 'overview' as const, label: '概览', icon: '📊' },
    { id: 'details' as const, label: '详细分析', icon: '🔍' },
    { id: 'recommendations' as const, label: '优化建议', icon: '💡' }
  ];

  const exportFormats: { format: ExportFormat; label: string; icon: string }[] = [
    { format: 'json', label: 'JSON', icon: '{ }' },
    { format: 'markdown', label: 'Markdown', icon: '📝' },
    { format: 'pdf', label: 'PDF', icon: '📄' }
  ];

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    setExportDropdown(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">分析结果</h2>
        
        <div className="relative">
          <button
            onClick={() => setExportDropdown(!exportDropdown)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>导出</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {exportDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              {exportFormats.map(({ format, label, icon }) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <span className="text-gray-500 dark:text-gray-400">{icon}</span>
                  <span className="text-gray-700 dark:text-gray-300">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Info Card */}
      {videoInfo && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">视频信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {videoInfo.title && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">标题：</span>
                <span className="text-gray-700 dark:text-gray-300 ml-1">{videoInfo.title}</span>
              </div>
            )}
            {videoInfo.author && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">作者：</span>
                <span className="text-gray-700 dark:text-gray-300 ml-1">{videoInfo.author}</span>
              </div>
            )}
            {videoInfo.duration && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">时长：</span>
                <span className="text-gray-700 dark:text-gray-300 ml-1">{formatDuration(videoInfo.duration)}</span>
              </div>
            )}
            {videoInfo.fileSize && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">大小：</span>
                <span className="text-gray-700 dark:text-gray-300 ml-1">{formatFileSize(videoInfo.fileSize)}</span>
              </div>
            )}
          </div>
          
          {/* GCS URL Display */}
          {videoInfo.gcsUrl && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">云存储地址：</span>
                <div className="flex items-center space-x-2">
                  {videoInfo.gcsUrl.startsWith('http') ? (
                    <>
                      <a 
                        href={videoInfo.gcsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[300px]"
                        title={videoInfo.gcsUrl}
                      >
                        {videoInfo.gcsUrl}
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(videoInfo.gcsUrl!);
                          // You could add a toast notification here
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="复制链接"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <a
                        href={videoInfo.gcsUrl}
                        download
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="下载视频"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </>
                  ) : (
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                      {videoInfo.gcsUrl}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* Show Gemini analysis if available */}
        {geminiAnalysis ? (
          <GeminiResultDisplay analysis={geminiAnalysis} />
        ) : (
          // Original tab content for backward compatibility
          <>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="mr-2">🎯</span> 爆款要素
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insights.viralFactors.map((factor, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="mr-2">🎨</span> 视觉元素
                </h3>
                <ul className="space-y-1">
                  {insights.visualElements.slice(0, 3).map((element, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 text-sm flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {element}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="mr-2">🎣</span> 开场钩子
                </h3>
                <ul className="space-y-1">
                  {insights.hooks.slice(0, 3).map((hook, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 text-sm flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      {hook}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="mr-2">💬</span> 互动策略
                </h3>
                <ul className="space-y-1">
                  {insights.engagementTactics.slice(0, 3).map((tactic, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 text-sm flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      {tactic}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">🎣 开场钩子分析</h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                {insights.hooks.map((hook, index) => (
                  <p key={index} className="text-gray-700 dark:text-gray-300 text-sm">
                    {index + 1}. {hook}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">🎵 音频分析</h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm">{insights.audioAnalysis}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">⏱ 节奏分析</h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm">{insights.pacing}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">🎨 视觉元素详解</h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                {insights.visualElements.map((element, index) => (
                  <p key={index} className="text-gray-700 dark:text-gray-300 text-sm">
                    • {element}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">💬 互动策略详解</h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                {insights.engagementTactics.map((tactic, index) => (
                  <p key={index} className="text-gray-700 dark:text-gray-300 text-sm">
                    • {tactic}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                基于分析的优化建议
              </h3>
              <div className="space-y-3">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 text-sm flex-1">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">💡 快速实施技巧</h4>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>• 前3秒必须有强视觉冲击或悬念</li>
                <li>• 使用当前流行的音乐和节奏</li>
                <li>• 设置互动点，引导用户评论</li>
                <li>• 控制视频长度在15-30秒最佳</li>
              </ul>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}