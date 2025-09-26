import { ParseResult } from '@/lib/types';

/**
 * TikTok/Douyin Parser Service
 * Parses share links and extracts video URLs
 */

// Mobile User Agent for proper page rendering
const MOBILE_USER_AGENT = 
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/121.0.2277.107 ' +
  'Version/17.0 Mobile/15E148 Safari/604.1';

export class TikTokParser {
  private headers: HeadersInit;

  constructor() {
    this.headers = {
      'User-Agent': MOBILE_USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    };
  }

  /**
   * Parse input text (URL or share text) and extract video information
   */
  async parseInput(input: string): Promise<ParseResult> {
    try {
      // Extract URL from input text
      const url = this.extractUrl(input);
      if (!url) {
        return {
          success: false,
          error: '未找到有效的分享链接或口令中的链接'
        };
      }

      // Determine platform and parse accordingly
      if (this.isDouyinUrl(url)) {
        return await this.parseDouyinUrl(url);
      } else if (this.isTikTokUrl(url)) {
        return await this.parseTikTokUrl(url);
      } else {
        return {
          success: false,
          error: '不支持的链接格式，请提供抖音或TikTok链接'
        };
      }
    } catch (error) {
      console.error('Parse error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '解析失败，请重试'
      };
    }
  }

  /**
   * Extract URL from share text or direct URL
   */
  private extractUrl(text: string): string | null {
    // Match URLs in the text
    const urlRegex = /https?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+/g;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
  }

  /**
   * Check if URL is a Douyin URL
   */
  private isDouyinUrl(url: string): boolean {
    return /douyin\.com|iesdouyin\.com/.test(url);
  }

  /**
   * Check if URL is a TikTok URL
   */
  private isTikTokUrl(url: string): boolean {
    return /tiktok\.com|vt\.tiktok\.com/.test(url);
  }

  /**
   * Parse Douyin URL and extract video information
   */
  private async parseDouyinUrl(shareUrl: string): Promise<ParseResult> {
    try {
      // First follow the redirect to get the actual video ID
      const redirectResponse = await fetch(shareUrl, {
        method: 'GET',
        headers: this.headers,
        redirect: 'follow'
      });

      if (!redirectResponse.ok) {
        throw new Error(`HTTP error! status: ${redirectResponse.status}`);
      }

      // Extract video ID from the final URL
      const finalUrl = redirectResponse.url;
      const videoId = this.extractDouyinVideoId(finalUrl);
      
      if (!videoId) {
        throw new Error('无法从URL中提取视频ID');
      }

      // Construct the API URL for video information
      const apiUrl = `https://www.iesdouyin.com/share/video/${videoId}`;
      
      // Fetch the page content
      const pageResponse = await fetch(apiUrl, {
        headers: this.headers
      });

      if (!pageResponse.ok) {
        throw new Error(`Failed to fetch video page: ${pageResponse.status}`);
      }

      const pageContent = await pageResponse.text();
      
      // Extract video data from page
      const videoData = this.extractDouyinVideoData(pageContent);
      
      if (!videoData) {
        throw new Error('无法从页面中提取视频信息');
      }

      return {
        success: true,
        videoUrl: videoData.videoUrl,
        pageUrl: finalUrl,
        metadata: {
          title: videoData.title,
          videoId: videoId,
          author: videoData.author,
          duration: videoData.duration
        }
      };
    } catch (error) {
      console.error('Douyin parse error:', error);
      throw error;
    }
  }

  /**
   * Parse TikTok URL and extract video information
   */
  private async parseTikTokUrl(shareUrl: string): Promise<ParseResult> {
    try {
      // Follow redirect to get actual video URL
      const response = await fetch(shareUrl, {
        method: 'GET',
        headers: this.headers,
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const finalUrl = response.url;
      const pageContent = await response.text();
      
      // Extract video data from TikTok page
      const videoData = this.extractTikTokVideoData(pageContent);
      
      if (!videoData) {
        throw new Error('无法从页面中提取视频信息');
      }

      return {
        success: true,
        videoUrl: videoData.videoUrl,
        pageUrl: finalUrl,
        metadata: {
          title: videoData.title,
          videoId: videoData.videoId,
          author: videoData.author,
          duration: videoData.duration
        }
      };
    } catch (error) {
      console.error('TikTok parse error:', error);
      throw error;
    }
  }

  /**
   * Extract Douyin video ID from URL
   */
  private extractDouyinVideoId(url: string): string | null {
    // Remove query parameters and get the last segment
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/').filter(s => s);
    const lastSegment = segments[segments.length - 1];
    
    // Check if it's a valid video ID (usually numeric)
    if (/^\d+$/.test(lastSegment)) {
      return lastSegment;
    }
    
    // Try to extract from common patterns
    const patterns = [
      /video\/(\d+)/,
      /note\/(\d+)/,
      /\/(\d+)\/?$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Extract video data from Douyin page content
   */
  private extractDouyinVideoData(pageContent: string): any {
    try {
      // Look for window._ROUTER_DATA
      const routerDataMatch = pageContent.match(/window\._ROUTER_DATA\s*=\s*({.*?})<\/script>/s);
      
      if (routerDataMatch) {
        const dataJson = JSON.parse(routerDataMatch[1]);
        
        // Try to find video info in different possible keys
        const possibleKeys = ['video_(id)/page', 'note_(id)/page'];
        let videoInfo = null;
        
        for (const key of possibleKeys) {
          if (dataJson.loaderData && dataJson.loaderData[key]) {
            const pageData = dataJson.loaderData[key];
            if (pageData.videoInfoRes) {
              videoInfo = pageData.videoInfoRes;
              break;
            }
          }
        }
        
        if (videoInfo && videoInfo.item_list && videoInfo.item_list[0]) {
          const item = videoInfo.item_list[0];
          const video = item.video;
          
          if (video && video.play_addr) {
            // Get the no-watermark URL
            const videoUrl = video.play_addr.url_list[0].replace('playwm', 'play');
            
            return {
              videoUrl: videoUrl,
              title: item.desc || `douyin_${item.aweme_id || 'video'}`,
              videoId: item.aweme_id || '',
              author: item.author?.nickname || '',
              duration: video.duration || 0
            };
          }
        }
      }
      
      // Fallback: Try to extract from __INITIAL_STATE__
      const initialStateMatch = pageContent.match(/window\[['"]__INITIAL_STATE__['"]\]\s*=\s*({.*?});/s);
      
      if (initialStateMatch) {
        const state = JSON.parse(initialStateMatch[1]);
        // Navigate through the state object to find video data
        // This structure may vary, so we need to be flexible
        if (state.detail && state.detail.video) {
          const video = state.detail.video;
          return {
            videoUrl: video.playUrl || video.downloadUrl || '',
            title: video.title || video.desc || 'douyin_video',
            videoId: video.id || '',
            author: video.authorName || '',
            duration: video.duration || 0
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting Douyin video data:', error);
      return null;
    }
  }

  /**
   * Extract video data from TikTok page content
   */
  private extractTikTokVideoData(pageContent: string): any {
    try {
      // Look for SIGI_STATE or __DEFAULT_SCOPE__
      const sigiMatch = pageContent.match(/window\['SIGI_STATE'\]\s*=\s*({.*?});/s);
      const scopeMatch = pageContent.match(/window\.__DEFAULT_SCOPE__\s*=\s*({.*?});/s);
      
      let data = null;
      
      if (sigiMatch) {
        data = JSON.parse(sigiMatch[1]);
      } else if (scopeMatch) {
        const scope = JSON.parse(scopeMatch[1]);
        data = scope['webapp.video-detail'];
      }
      
      if (data) {
        // Navigate to find video information
        let videoData = null;
        
        // Try different paths based on TikTok's structure
        if (data.ItemModule) {
          const items = Object.values(data.ItemModule);
          if (items.length > 0) {
            videoData = items[0] as any;
          }
        } else if (data.itemInfo && data.itemInfo.itemStruct) {
          videoData = data.itemInfo.itemStruct;
        }
        
        if (videoData && videoData.video) {
          return {
            videoUrl: videoData.video.downloadAddr || videoData.video.playAddr || '',
            title: videoData.desc || 'tiktok_video',
            videoId: videoData.id || '',
            author: videoData.author?.nickname || videoData.author?.uniqueId || '',
            duration: videoData.video.duration || 0
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting TikTok video data:', error);
      return null;
    }
  }

  /**
   * Extract video URL directly (with retry mechanism)
   */
  async extractVideoUrl(pageUrl: string, maxRetries: number = 3): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await this.parseInput(pageUrl);
        if (result.success && result.videoUrl) {
          return result.videoUrl;
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i < maxRetries - 1) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw new Error('无法提取视频URL，请检查链接是否有效');
  }

  /**
   * Validate if URL is supported
   */
  validateUrl(url: string): boolean {
    const cleanUrl = this.extractUrl(url);
    if (!cleanUrl) return false;
    return this.isDouyinUrl(cleanUrl) || this.isTikTokUrl(cleanUrl);
  }
}

// Export a singleton instance
export default new TikTokParser();