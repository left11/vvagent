// Processing Status Types
export type ProcessingStatus = 
  | 'idle'
  | 'parsing'
  | 'downloading'
  | 'uploading'
  | 'video_ready'
  | 'analyzing'
  | 'completed'
  | 'error';

// Video Metadata
export interface VideoMetadata {
  id: string;
  originalUrl: string;
  title?: string;
  author?: string;
  duration?: number;
  downloadedAt: Date;
  gcsUrl?: string;
  fileSize?: number;
}

// Import Gemini types
import type { GeminiAnalysisResult } from '../services/gemini-analyzer';

// Analysis Result
export interface AnalysisResult {
  videoInfo: VideoMetadata;
  geminiAnalysis?: GeminiAnalysisResult;
  insights: {
    hooks: string[];
    visualElements: string[];
    audioAnalysis: string;
    pacing: string;
    engagementTactics: string[];
    viralFactors: string[];
  };
  recommendations: string[];
}

// Processing State
export interface ProcessingState {
  sessionId: string;
  input: string;
  status: ProcessingStatus;
  progress?: number;
  parsedUrl?: string;
  videoMetadata?: VideoMetadata;
  analysisResult?: AnalysisResult;
  createdAt: Date;
  updatedAt: Date;
  error?: {
    message: string;
    code: string;
    timestamp: Date;
  };
}

// Parse Result
export interface ParseResult {
  success: boolean;
  videoUrl?: string;
  pageUrl?: string;
  error?: string;
  metadata?: {
    title?: string;
    videoId?: string;
    author?: string;
    duration?: number;
  };
}

// Export Format
export type ExportFormat = 'json' | 'markdown' | 'pdf';

// Error Codes
export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  PARSE_ERROR = 'PARSE_ERROR',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
}