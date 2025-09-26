import TikTokParser from '@/lib/services/tiktok-parser';

// Mock fetch for testing
global.fetch = jest.fn();

describe('TikTokParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseInput', () => {
    it('should extract URL from share text', async () => {
      const shareText = '复制此链接，打开抖音，查看视频 https://v.douyin.com/abc123';
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // Mock redirect response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        url: 'https://www.douyin.com/video/123456789',
        text: async () => `
          <script>
          window._ROUTER_DATA = {
            "loaderData": {
              "video_(id)/page": {
                "videoInfoRes": {
                  "item_list": [{
                    "aweme_id": "123456789",
                    "desc": "测试视频",
                    "author": {
                      "nickname": "测试作者"
                    },
                    "video": {
                      "duration": 15000,
                      "play_addr": {
                        "url_list": ["https://v.douyin.com/playwm/123456789"]
                      }
                    }
                  }]
                }
              }
            }
          }
          </script>
        `
      } as Response);

      // Mock page fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => `
          <script>
          window._ROUTER_DATA = {
            "loaderData": {
              "video_(id)/page": {
                "videoInfoRes": {
                  "item_list": [{
                    "aweme_id": "123456789",
                    "desc": "测试视频",
                    "author": {
                      "nickname": "测试作者"
                    },
                    "video": {
                      "duration": 15000,
                      "play_addr": {
                        "url_list": ["https://v.douyin.com/playwm/123456789"]
                      }
                    }
                  }]
                }
              }
            }
          }
          </script>
        `
      } as Response);

      const result = await TikTokParser.parseInput(shareText);
      
      expect(result.success).toBe(true);
      expect(result.videoUrl).toBeDefined();
      expect(result.metadata?.title).toBe('测试视频');
    });

    it('should handle invalid input', async () => {
      const invalidInput = '这不是一个有效的链接';
      
      const result = await TikTokParser.parseInput(invalidInput);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle Douyin URL directly', async () => {
      const douyinUrl = 'https://www.douyin.com/video/123456789';
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // Mock responses
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        url: douyinUrl,
        text: async () => ''
      } as Response);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => `
          <script>
          window._ROUTER_DATA = {
            "loaderData": {
              "video_(id)/page": {
                "videoInfoRes": {
                  "item_list": [{
                    "aweme_id": "123456789",
                    "desc": "直接链接视频",
                    "video": {
                      "play_addr": {
                        "url_list": ["https://v.douyin.com/playwm/123456789"]
                      }
                    }
                  }]
                }
              }
            }
          }
          </script>
        `
      } as Response);

      const result = await TikTokParser.parseInput(douyinUrl);
      
      expect(result.success).toBe(true);
      expect(result.videoUrl).toContain('play');
      expect(result.metadata?.title).toBe('直接链接视频');
    });

    it('should handle TikTok URL', async () => {
      const tiktokUrl = 'https://www.tiktok.com/@user/video/123456789';
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        url: tiktokUrl,
        text: async () => `
          <script>
          window['SIGI_STATE'] = {
            "ItemModule": {
              "123456789": {
                "id": "123456789",
                "desc": "TikTok video",
                "author": {
                  "nickname": "TikTok User"
                },
                "video": {
                  "duration": 30,
                  "downloadAddr": "https://v.tiktok.com/download/123456789"
                }
              }
            }
          };
          </script>
        `
      } as Response);

      const result = await TikTokParser.parseInput(tiktokUrl);
      
      expect(result.success).toBe(true);
      expect(result.videoUrl).toBeDefined();
    });

    it('should handle network errors', async () => {
      const url = 'https://www.douyin.com/video/123';
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await TikTokParser.parseInput(url);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('validateUrl', () => {
    it('should validate Douyin URLs', () => {
      expect(TikTokParser.validateUrl('https://www.douyin.com/video/123')).toBe(true);
      expect(TikTokParser.validateUrl('https://v.douyin.com/abc123')).toBe(true);
      expect(TikTokParser.validateUrl('复制链接 https://www.douyin.com/video/123')).toBe(true);
    });

    it('should validate TikTok URLs', () => {
      expect(TikTokParser.validateUrl('https://www.tiktok.com/@user/video/123')).toBe(true);
      expect(TikTokParser.validateUrl('https://vt.tiktok.com/abc123')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(TikTokParser.validateUrl('https://www.youtube.com/watch?v=123')).toBe(false);
      expect(TikTokParser.validateUrl('not a url')).toBe(false);
      expect(TikTokParser.validateUrl('')).toBe(false);
    });
  });

  describe('extractVideoUrl with retry', () => {
    it('should retry on failure', async () => {
      const url = 'https://www.douyin.com/video/123';
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // First attempt fails
      mockFetch.mockRejectedValueOnce(new Error('Temporary error'));
      
      // Second attempt succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        url: url,
        text: async () => ''
      } as Response);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => `
          <script>
          window._ROUTER_DATA = {
            "loaderData": {
              "video_(id)/page": {
                "videoInfoRes": {
                  "item_list": [{
                    "video": {
                      "play_addr": {
                        "url_list": ["https://v.douyin.com/play/123"]
                      }
                    }
                  }]
                }
              }
            }
          }
          </script>
        `
      } as Response);

      const videoUrl = await TikTokParser.extractVideoUrl(url, 3);
      
      expect(videoUrl).toContain('play');
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 failed + 2 successful
    });

    it('should throw error after max retries', async () => {
      const url = 'https://www.douyin.com/video/123';
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // All attempts fail
      mockFetch.mockRejectedValue(new Error('Persistent error'));
      
      await expect(TikTokParser.extractVideoUrl(url, 2)).rejects.toThrow('无法提取视频URL');
    });
  });
});