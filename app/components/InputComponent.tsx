'use client';

import { useState } from 'react';

interface InputComponentProps {
  onAnalyze: (input: string) => Promise<void>;
  disabled: boolean;
}

export default function InputComponent({ onAnalyze, disabled }: InputComponentProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateInput = (value: string): boolean => {
    if (!value.trim()) {
      setValidationError('请输入抖音链接或口令');
      return false;
    }

    // Check if it's a TikTok URL pattern
    const tiktokUrlPattern = /(?:https?:\/\/)?(?:www\.|m\.)?(?:tiktok\.com|douyin\.com|vt\.tiktok\.com)/i;
    const shareTextPattern = /复制此链接|打开抖音|抖音.*搜索|#在抖音/;
    
    if (!tiktokUrlPattern.test(value) && !shareTextPattern.test(value)) {
      setValidationError('请输入有效的抖音链接或分享口令');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInput(input)) {
      return;
    }

    setIsLoading(true);
    try {
      await onAnalyze(input);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    if (validationError) {
      setValidationError('');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      setValidationError('');
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tiktok-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          抖音视频链接或口令
        </label>
        <div className="relative">
          <textarea
            id="tiktok-input"
            value={input}
            onChange={handleInputChange}
            placeholder={`输入抖音链接，例如：\nhttps://www.douyin.com/video/...\n或粘贴分享口令：\n复制此链接，打开抖音...`}
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none transition-colors"
            rows={4}
            disabled={disabled || isLoading}
          />
          {!input && (
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-2 top-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="粘贴"
              disabled={disabled || isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
          )}
        </div>
        {validationError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationError}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="submit"
          disabled={disabled || isLoading || !input.trim()}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              分析中...
            </span>
          ) : (
            '分析'
          )}
        </button>
        
        {input && (
          <button
            type="button"
            onClick={() => {
              setInput('');
              setValidationError('');
            }}
            className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={disabled || isLoading}
          >
            清除
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>支持的格式：</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>抖音视频链接 (douyin.com)</li>
          <li>抖音分享口令（复制整段文字）</li>
          <li>TikTok链接 (tiktok.com)</li>
        </ul>
      </div>
    </form>
  );
}