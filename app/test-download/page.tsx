'use client';

import { useState } from 'react';

export default function TestDownload() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<any>(null);

  const testParse = async () => {
    try {
      setStatus('Parsing...');
      const response = await fetch(`/api/analyze?url=${encodeURIComponent(input)}`);
      const data = await response.json();
      setResult(data);
      setStatus(data.success ? 'Parse successful!' : 'Parse failed');
    } catch (error) {
      setStatus('Error: ' + (error as Error).message);
      setResult(null);
    }
  };

  const testDownload = async () => {
    try {
      setStatus('Downloading...');
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });
      
      const data = await response.json();
      setResult(data);
      setStatus(data.success ? 'Download successful!' : 'Download failed');
    } catch (error) {
      setStatus('Error: ' + (error as Error).message);
      setResult(null);
    }
  };

  const directDownload = () => {
    // Open download in new tab
    window.open(`/api/download?share=${encodeURIComponent(input)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">视频下载测试页面</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              输入抖音链接或分享口令
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              rows={4}
              placeholder="例如: https://www.douyin.com/video/xxx 或 复制此链接..."
            />
          </div>

          <div className="flex space-x-4 mb-4">
            <button
              onClick={testParse}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              测试解析
            </button>
            <button
              onClick={testDownload}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              测试下载 (JSON)
            </button>
            <button
              onClick={directDownload}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              直接下载视频
            </button>
          </div>

          {status && (
            <div className={`p-3 rounded mb-4 ${
              status.includes('successful') ? 'bg-green-100 text-green-700' : 
              status.includes('Error') || status.includes('failed') ? 'bg-red-100 text-red-700' : 
              'bg-blue-100 text-blue-700'
            }`}>
              {status}
            </div>
          )}

          {result && (
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded">
              <h3 className="font-semibold mb-2">结果:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h2 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            ⚠️ 注意事项
          </h2>
          <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>确保视频链接是公开可访问的</li>
            <li>下载使用无水印链接（play 而非 playwm）</li>
            <li>包含正确的 User-Agent 和 Referer 头</li>
            <li>支持重试机制（最多3次）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}