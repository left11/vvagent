'use client';

import { useState } from 'react';
import InputComponent from './components/InputComponent';
import StatusDisplay from './components/StatusDisplay';
import ResultDisplay from './components/ResultDisplay';
import { ProcessingStatus, AnalysisResult, VideoMetadata } from '@/lib/types';

export default function Home() {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [parsedUrl, setParsedUrl] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<VideoMetadata | undefined>();
  const [result, setResult] = useState<AnalysisResult | undefined>();
  const [error, setError] = useState<string>('');
  const [warning, setWarning] = useState<string>('');

  const handleAnalyze = async (input: string) => {
    try {
      setStatus('parsing');
      setError('');
      setWarning('');
      setProgress(0);
      setParsedUrl('');
      setVideoInfo(undefined);
      setResult(undefined);

      // Use Server-Sent Events for real-time updates
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error('分析请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            // 跳过空数据
            if (!jsonStr || jsonStr === '[DONE]') {
              continue;
            }
            try {
              const data = JSON.parse(jsonStr);
              
              if (data.status) {
                setStatus(data.status);
              }
              if (data.progress !== undefined) {
                setProgress(data.progress);
              }
              if (data.parsedUrl) {
                setParsedUrl(data.parsedUrl);
              }
              if (data.videoInfo) {
                setVideoInfo(data.videoInfo);
              }
              if (data.result) {
                setResult(data.result);
              }
              if (data.warning) {
                setWarning(data.warning);
              }
              if (data.error) {
                setError(data.error);
                setStatus('error');
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
      
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : '发生未知错误');
    }
  };

  const handleExport = (format: 'json' | 'markdown' | 'pdf') => {
    // TODO: Implement export functionality
    console.log('Exporting as:', format);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            抖音爆款视频分析器
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            输入抖音视频链接或口令，AI 智能分析爆款要素
          </p>
        </header>

        <div className="space-y-8">
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <InputComponent 
              onAnalyze={handleAnalyze} 
              disabled={status !== 'idle' && status !== 'completed' && status !== 'error'}
            />
          </div>

          {/* Status Display Section */}
          {status !== 'idle' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <StatusDisplay 
                status={status} 
                progress={progress} 
                parsedUrl={parsedUrl}
              />
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              {warning && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-yellow-600 dark:text-yellow-400">{warning}</p>
                </div>
              )}
            </div>
          )}

          {/* Video Info Section - Shows immediately after upload */}
          {videoInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                📹 视频信息
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {videoInfo.title && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">标题</span>
                      <p className="text-gray-900 dark:text-white font-medium">{videoInfo.title}</p>
                    </div>
                  )}
                  {videoInfo.author && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">作者</span>
                      <p className="text-gray-900 dark:text-white font-medium">{videoInfo.author}</p>
                    </div>
                  )}
                  {videoInfo.duration !== undefined && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">时长</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {Math.floor(videoInfo.duration / 60)}:{String(videoInfo.duration % 60).padStart(2, '0')}
                      </p>
                    </div>
                  )}
                  {videoInfo.fileSize && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">文件大小</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {(videoInfo.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
                {videoInfo.gcsUrl && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400">云存储链接</span>
                    <div className="flex items-center gap-2 mt-1">
                      <a 
                        href={videoInfo.gcsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline truncate flex-1"
                      >
                        {videoInfo.gcsUrl}
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(videoInfo.gcsUrl!)}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        复制
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analysis Results Section */}
          {result && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <ResultDisplay 
                analysisResult={result} 
                onExport={handleExport}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="mt-16 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© 2024 抖音爆款视频分析器 | 基于 Gemini AI 技术</p>
      </footer>
    </div>
  );
}
