/**
 * SnapAny API 视频解析服务
 * 支持多平台视频解析
 */

import crypto from 'crypto';

// 平台配置
export const PLATFORM_CONFIG = {
  TIKTOK: { useNewApi: true, lang: 'en' },
  DOUYIN: { useNewApi: true, lang: 'zh' },
  YOUTUBE: { useNewApi: true, lang: 'en' },
  BILIBILI: { useNewApi: true, lang: 'zh' },
  FACEBOOK: { useNewApi: false, site: 'facebook' },
  INSTAGRAM: { useNewApi: false, site: 'instagram' },
  TWITTER: { useNewApi: false, site: 'twitter' }
};

// API 密钥
const KEY_NEW_API = '6HTugjCXxR';
const KEY_OLD_API = '2HT8gjE3xL';
const NEW_API_URL = 'https://api.snapany.com/v1/extract';
const OLD_API_URL = 'https://service.iiilab.com/iiilab/extract';

// 媒体类型
export interface Media {
  media_type: 'video' | 'audio' | 'image';
  resource_url: string;
  preview_url?: string;
  formats?: Array<{
    quality: number;
    video_url: string;
    video_ext: string;
    video_size?: number;
    quality_note: string;
    alternate_url?: string;
  }>;
}

// API 响应格式
export interface SnapAnyResponse {
  text?: string;
  medias?: Media[];
  stats?: any;
  overseas?: number;
  error?: string;
}

// 解析结果格式（适配前端）
export interface ParseResult {
  success: boolean;
  platform: string;
  videoUrl?: string;
  coverUrl?: string;
  title?: string;
  author?: string;
  duration?: number;
  formats?: Array<{
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

class SnapAnyParser {
  /**
   * 检测平台类型
   */
  detectPlatform(url: string): string {
    if (url.includes('tiktok.com') || url.includes('vt.tiktok.com')) return 'TIKTOK';
    if (url.includes('douyin.com') || url.includes('iesdouyin.com') || url.includes('抖音')) return 'DOUYIN';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YOUTUBE';
    if (url.includes('instagram.com')) return 'INSTAGRAM';
    if (url.includes('bilibili.com') || url.includes('b23.tv')) return 'BILIBILI';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'FACEBOOK';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'TWITTER';
    return 'UNKNOWN';
  }

  /**
   * 生成签名
   */
  generateSign(url: string, s1: string, timestamp: string, key: string): string {
    const signStr = url + s1 + timestamp + key;
    return crypto.createHash('md5').update(signStr).digest('hex');
  }

  /**
   * 调用 SnapAny API
   */
  async callSnapAnyAPI(url: string, platform: string): Promise<SnapAnyResponse> {
    const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const timestamp = Date.now().toString();
    const key = config.useNewApi ? KEY_NEW_API : KEY_OLD_API;
    const s1 = config.useNewApi ? (config as any).lang : (config as any).site;
    const sign = this.generateSign(url, s1, timestamp, key);

    const headers: any = {
      'G-Timestamp': timestamp,
      'G-Footer': sign,
      'Content-Type': 'application/json',
    };

    // 根据API类型设置不同的参数和URL
    let apiUrl: string;
    let data: any;
    
    if (config.useNewApi) {
      // 新 API 使用 Accept-Language 头和 link 字段
      headers['Accept-Language'] = s1;
      apiUrl = NEW_API_URL;
      data = { link: url };
    } else {
      // 旧 API 使用 site 参数和 url 字段
      apiUrl = OLD_API_URL;
      data = {
        url: url,
        site: s1
      };
    }

    try {
      console.log(`[SnapAny] Calling ${config.useNewApi ? 'NEW' : 'OLD'} API for ${platform}:`, url);
      console.log(`[SnapAny] API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SnapAny] API Error: ${response.status} - ${errorText}`);
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[SnapAny] API Response:`, JSON.stringify(result, null, 2).substring(0, 500));
      
      return result;
    } catch (error) {
      console.error('[SnapAny] API call failed:', error);
      throw error;
    }
  }

  /**
   * 解析视频
   */
  async parseVideo(url: string): Promise<ParseResult> {
    try {
      // 检测平台
      const platform = this.detectPlatform(url);
      if (platform === 'UNKNOWN') {
        return {
          success: false,
          platform: 'unknown',
          error: '不支持的平台或链接格式错误',
        };
      }

      // 调用 API
      const apiResult = await this.callSnapAnyAPI(url, platform);

      // 处理错误
      if (apiResult.error) {
        return {
          success: false,
          platform: platform.toLowerCase(),
          error: apiResult.error,
        };
      }

      // 解析结果
      const result: ParseResult = {
        success: false,
        platform: platform.toLowerCase(),
      };

      // 提取视频信息
      if (apiResult.medias && apiResult.medias.length > 0) {
        const videoMedia = apiResult.medias.find(m => m.media_type === 'video');
        
        if (videoMedia) {
          result.success = true;
          result.videoUrl = videoMedia.resource_url;
          result.coverUrl = videoMedia.preview_url;
          result.title = apiResult.text || undefined;

          // 处理多质量格式（YouTube 等）
          if (videoMedia.formats && videoMedia.formats.length > 0) {
            result.formats = videoMedia.formats.map(f => ({
              quality: f.quality_note || `${f.quality}p`,
              url: f.video_url,
              size: f.video_size,
            }));
            
            // 默认选择最高质量
            const highestQuality = videoMedia.formats
              .sort((a, b) => (b.quality || 0) - (a.quality || 0))[0];
            result.videoUrl = highestQuality.video_url;
          }
        } else {
          // 可能只有音频（某些情况）
          const audioMedia = apiResult.medias.find(m => m.media_type === 'audio');
          if (audioMedia) {
            result.success = true;
            result.videoUrl = audioMedia.resource_url;
            result.title = apiResult.text || undefined;
          }
        }
      }

      // 平台特定处理
      switch (platform) {
        case 'DOUYIN':
        case 'TIKTOK':
          // 抖音/TikTok 特殊处理
          if (result.title) {
            // 尝试从标题提取作者（通常格式为 @username）
            const authorMatch = result.title.match(/@[\w.]+/);
            if (authorMatch) {
              result.author = authorMatch[0];
            }
          }
          break;
          
        case 'YOUTUBE':
          // YouTube 返回多个质量选项
          // 已在上面处理
          break;
          
        case 'BILIBILI':
          // B站特殊处理
          break;
      }

      // 如果没有找到视频
      if (!result.success) {
        result.error = '未能从该链接提取视频信息';
      }

      return result;

    } catch (error) {
      console.error('[SnapAny] Parse error:', error);
      return {
        success: false,
        platform: 'unknown',
        error: error instanceof Error ? error.message : '解析失败',
      };
    }
  }

  /**
   * 提取 URL（从分享文本中）
   */
  extractUrl(text: string): string | null {
    // 匹配各种 URL 格式
    const urlRegex = /(https?:\/\/[^\s\u4e00-\u9fa5]+)/gi;
    const matches = text.match(urlRegex);
    
    if (matches && matches.length > 0) {
      // 清理 URL 末尾的标点符号
      return matches[0].replace(/["""'''，。！？、\s]+$/, '');
    }
    
    return null;
  }
}

export default new SnapAnyParser();