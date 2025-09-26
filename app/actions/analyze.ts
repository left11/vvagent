'use server';

import tiktokParser from '@/lib/services/tiktok-parser';
import videoDownloader from '@/lib/services/video-downloader';
import { ProcessingStatus, AnalysisResult, VideoMetadata } from '@/lib/types';

// Temporary in-memory storage for demo purposes
// In production, use a proper database or Redis
const processingStates = new Map<string, any>();

export interface AnalysisResponse {
  sessionId: string;
  status: ProcessingStatus;
  progress?: number;
  parsedUrl?: string;
  result?: AnalysisResult;
  error?: string;
}

/**
 * Main Server Action to analyze a TikTok/Douyin video
 */
export async function analyzeVideo(input: string): Promise<AnalysisResponse> {
  const sessionId = generateSessionId();
  
  try {
    // Initialize processing state
    updateProcessingState(sessionId, {
      status: 'parsing' as ProcessingStatus,
      input,
      progress: 0,
      createdAt: new Date()
    });

    // Step 1: Parse the input URL/share text
    console.log('Parsing input:', input);
    const parseResult = await tiktokParser.parseInput(input);
    
    if (!parseResult.success || !parseResult.videoUrl) {
      throw new Error(parseResult.error || '无法解析视频链接');
    }

    const parsedUrl = parseResult.videoUrl;
    const metadata = parseResult.metadata;
    
    updateProcessingState(sessionId, {
      status: 'parsing' as ProcessingStatus,
      parsedUrl,
      progress: 25
    });

    // For now, return a mock successful response
    // In a real implementation, you would:
    // 1. Download the video
    // 2. Upload to GCS
    // 3. Analyze with Gemini AI
    
    // Mock delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create mock analysis result
    const mockResult: AnalysisResult = {
      videoInfo: {
        id: metadata?.videoId || sessionId,
        originalUrl: input,
        title: metadata?.title || '抖音视频',
        author: metadata?.author,
        duration: metadata?.duration,
        downloadedAt: new Date(),
        gcsUrl: 'gs://mock-bucket/video.mp4',
        fileSize: 5242880
      },
      insights: {
        hooks: [
          '开场3秒内使用强烈视觉冲击',
          '设置悬念引发观众好奇心',
          '使用热门BGM增强记忆点'
        ],
        visualElements: [
          '高对比度色彩搭配吸引眼球',
          '快速剪辑保持观看节奏',
          '文字动画强化关键信息'
        ],
        audioAnalysis: '背景音乐节奏与画面切换完美配合，使用了当前热门音频，增强传播性',
        pacing: '采用快速剪辑技巧，平均每2-3秒切换场景，保持观众注意力',
        engagementTactics: [
          '在视频中设置互动问题',
          '引导用户评论特定内容',
          '使用争议性话题引发讨论'
        ],
        viralFactors: [
          '情感共鸣',
          '视觉冲击',
          '音乐洗脑',
          '话题性强'
        ]
      },
      recommendations: [
        '优化前3秒的内容，增加更强的视觉或听觉钩子',
        '在视频结尾添加引导关注的提示',
        '使用更多特效转场提升视觉体验',
        '控制视频时长在15-20秒以内，提高完播率',
        '添加字幕提高无声观看体验'
      ]
    };

    updateProcessingState(sessionId, {
      status: 'completed' as ProcessingStatus,
      progress: 100,
      result: mockResult
    });

    return {
      sessionId,
      status: 'completed',
      progress: 100,
      parsedUrl,
      result: mockResult
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '分析过程中发生错误';
    
    updateProcessingState(sessionId, {
      status: 'error' as ProcessingStatus,
      error: errorMessage
    });

    return {
      sessionId,
      status: 'error',
      error: errorMessage
    };
  }
}

/**
 * Check the progress of an ongoing analysis
 */
export async function checkProgress(sessionId: string): Promise<AnalysisResponse | null> {
  const state = processingStates.get(sessionId);
  
  if (!state) {
    return null;
  }

  return {
    sessionId,
    status: state.status,
    progress: state.progress,
    parsedUrl: state.parsedUrl,
    result: state.result,
    error: state.error
  };
}

/**
 * Parse URL only (without full analysis)
 */
export async function parseUrl(input: string): Promise<{
  success: boolean;
  videoUrl?: string;
  metadata?: any;
  error?: string;
}> {
  try {
    const result = await tiktokParser.parseInput(input);
    return {
      success: result.success,
      videoUrl: result.videoUrl,
      metadata: result.metadata,
      error: result.error
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '解析失败'
    };
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Update processing state in memory
 */
function updateProcessingState(sessionId: string, update: any): void {
  const current = processingStates.get(sessionId) || {};
  processingStates.set(sessionId, {
    ...current,
    ...update,
    updatedAt: new Date()
  });

  // Clean up old sessions (older than 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [key, value] of processingStates.entries()) {
    if (value.createdAt && value.createdAt < oneHourAgo) {
      processingStates.delete(key);
    }
  }
}