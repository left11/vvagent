import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

/**
 * Video Downloader Service
 * Downloads videos from parsed URLs with proper headers
 */

// Use the same mobile User Agent as the parser
const MOBILE_USER_AGENT = 
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/121.0.2277.107 ' +
  'Version/17.0 Mobile/15E148 Safari/604.1';

export interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  outputDir?: string;
  filename?: string;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  error?: string;
}

export class VideoDownloader {
  private headers: HeadersInit;
  private tempDir: string;

  constructor() {
    this.headers = {
      'User-Agent': MOBILE_USER_AGENT,
      'Referer': 'https://www.douyin.com/',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
    };
    
    // Create temp directory for downloads
    this.tempDir = path.join(process.cwd(), 'temp', 'downloads');
    this.ensureTempDir();
  }

  /**
   * Download video from URL
   * This uses the parsed no-watermark URL (with 'play' instead of 'playwm')
   */
  async download(
    videoUrl: string, 
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    try {
      console.log('Starting download from:', videoUrl);
      
      // Ensure the URL is a no-watermark URL
      const downloadUrl = this.ensureNoWatermark(videoUrl);
      console.log('Using download URL:', downloadUrl);
      
      // Make the request with proper headers
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: this.headers,
        redirect: 'follow', // Follow redirects
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get content length for progress tracking
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      // Determine output filename and path
      const filename = options.filename || this.generateFilename();
      const outputDir = options.outputDir || this.tempDir;
      const filePath = path.join(outputDir, filename);
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Download with progress tracking
      if (response.body) {
        await this.downloadWithProgress(
          response.body,
          filePath,
          totalSize,
          options.onProgress
        );
      } else {
        throw new Error('No response body received');
      }

      // Verify file was created
      if (!fs.existsSync(filePath)) {
        throw new Error('Download completed but file not found');
      }

      const stats = fs.statSync(filePath);
      
      return {
        success: true,
        filePath,
        fileSize: stats.size,
      };
      
    } catch (error) {
      console.error('Download error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  /**
   * Download video with retry mechanism
   */
  async downloadWithRetry(
    videoUrl: string,
    options: DownloadOptions = {},
    maxRetries: number = 3
  ): Promise<DownloadResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Download attempt ${attempt + 1} of ${maxRetries}`);
        
        const result = await this.download(videoUrl, options);
        
        if (result.success) {
          return result;
        }
        
        lastError = new Error(result.error || 'Unknown error');
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Download failed');
        console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'Max retries exceeded',
    };
  }

  /**
   * Ensure URL is for no-watermark download
   */
  private ensureNoWatermark(url: string): string {
    // If it contains 'playwm', replace with 'play' for no-watermark
    if (url.includes('playwm')) {
      return url.replace('playwm', 'play');
    }
    return url;
  }

  /**
   * Download with progress tracking using Node.js streams
   */
  private async downloadWithProgress(
    body: ReadableStream<Uint8Array>,
    filePath: string,
    totalSize: number,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    const reader = body.getReader();
    const fileStream = fs.createWriteStream(filePath);
    
    let downloadedSize = 0;
    let lastProgressUpdate = 0;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Write chunk to file
        fileStream.write(Buffer.from(value));
        
        // Update progress
        downloadedSize += value.length;
        
        if (onProgress && totalSize > 0) {
          const now = Date.now();
          // Update progress at most every 100ms to avoid too many updates
          if (now - lastProgressUpdate > 100) {
            const percentage = Math.round((downloadedSize / totalSize) * 100);
            onProgress({
              downloaded: downloadedSize,
              total: totalSize,
              percentage,
            });
            lastProgressUpdate = now;
          }
        }
      }
      
      // Final progress update
      if (onProgress && totalSize > 0) {
        onProgress({
          downloaded: downloadedSize,
          total: totalSize,
          percentage: 100,
        });
      }
      
    } finally {
      fileStream.end();
      reader.releaseLock();
    }
    
    // Wait for file write to complete
    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
  }

  /**
   * Generate a unique filename
   */
  private generateFilename(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `douyin_${timestamp}_${random}.mp4`;
  }

  /**
   * Ensure temp directory exists
   */
  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Clean up temp files older than specified hours
   */
  async cleanupOldFiles(hoursOld: number = 24): Promise<void> {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const maxAge = hoursOld * 60 * 60 * 1000;
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;
        
        if (age > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Get download headers (for debugging)
   */
  getHeaders(): HeadersInit {
    return { ...this.headers };
  }
}

// Export singleton instance
export default new VideoDownloader();