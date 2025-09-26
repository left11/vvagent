'use client';

import { ProcessingStatus } from '@/lib/types';
import { useEffect, useState } from 'react';

interface StatusDisplayProps {
  status: ProcessingStatus;
  progress?: number;
  parsedUrl?: string;
}

export default function StatusDisplay({ status, progress = 0, parsedUrl }: StatusDisplayProps) {
  const [dots, setDots] = useState('');
  
  // Animate dots for loading states
  useEffect(() => {
    if (status === 'idle' || status === 'completed' || status === 'error') {
      return;
    }
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'parsing':
        return {
          text: '正在解析链接',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ),
          showProgress: false,
          estimatedTime: '约 2-5 秒'
        };
      case 'downloading':
        return {
          text: '正在下载视频',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          ),
          showProgress: true,
          estimatedTime: '约 10-30 秒'
        };
      case 'uploading':
        return {
          text: '正在上传到云存储',
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          ),
          showProgress: true,
          estimatedTime: '约 5-15 秒'
        };
      case 'analyzing':
        return {
          text: '正在分析视频内容',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: (
            <svg className="animate-pulse h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
          showProgress: false,
          estimatedTime: '约 15-30 秒'
        };
      case 'completed':
        return {
          text: '分析完成',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          showProgress: false,
          estimatedTime: null
        };
      case 'error':
        return {
          text: '处理失败',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          showProgress: false,
          estimatedTime: null
        };
      default:
        return {
          text: '等待中',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          icon: null,
          showProgress: false,
          estimatedTime: null
        };
    }
  };

  const config = getStatusConfig();
  const isProcessing = status !== 'idle' && status !== 'completed' && status !== 'error';

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-center space-x-3">
          {config.icon && (
            <div className={config.color}>
              {config.icon}
            </div>
          )}
          <div className="flex-1">
            <p className={`font-medium ${config.color}`}>
              {config.text}{isProcessing ? dots : ''}
            </p>
            {config.estimatedTime && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                预计时间：{config.estimatedTime}
              </p>
            )}
          </div>
        </div>

        {config.showProgress && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>进度</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="h-full bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {parsedUrl && (
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">解析的视频链接：</p>
            <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
              {parsedUrl}
            </p>
          </div>
        )}
      </div>

      {/* Processing Steps Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-between px-4">
          {['解析', '下载', '上传', '分析'].map((step, index) => {
            const steps = ['parsing', 'downloading', 'uploading', 'analyzing'];
            const currentStepIndex = steps.indexOf(status);
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            
            return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                    ${isActive ? 'bg-blue-600 text-white' : ''}
                    ${isCompleted ? 'bg-green-600 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
                  `}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`
                    text-xs mt-1
                    ${isActive ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}
                    ${isCompleted ? 'text-green-600 dark:text-green-400' : ''}
                    ${!isActive && !isCompleted ? 'text-gray-400 dark:text-gray-500' : ''}
                  `}>
                    {step}
                  </span>
                </div>
                {index < 3 && (
                  <div className={`
                    w-12 h-0.5 mx-2 -mt-4
                    ${isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}
                  `}></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}