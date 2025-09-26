import {
  isValidTikTokUrl,
  isValidTikTokShareText,
  extractUrlFromShareText,
  detectInputType,
  isValidFileSize,
  generateSessionId
} from '@/lib/utils/validation';

describe('Validation Utilities', () => {
  describe('isValidTikTokUrl', () => {
    it('should validate standard TikTok URLs', () => {
      const validUrls = [
        'https://www.tiktok.com/@username/video/1234567890',
        'http://tiktok.com/@user.name/video/9876543210',
        'https://vm.tiktok.com/ABCDEFG',
        'https://vt.tiktok.com/XYZ123',
        'https://www.tiktok.com/t/ZPRHnwxyz/'
      ];

      validUrls.forEach(url => {
        expect(isValidTikTokUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://youtube.com/watch?v=123',
        'https://facebook.com/video/123',
        'not-a-url',
        'https://tiktok.com',
        'ftp://tiktok.com/@user/video/123'
      ];

      invalidUrls.forEach(url => {
        expect(isValidTikTokUrl(url)).toBe(false);
      });
    });
  });

  describe('isValidTikTokShareText', () => {
    it('should validate TikTok share text patterns', () => {
      const validTexts = [
        '复制此链接，打开抖音，查看视频',
        '复制口令 #abc123# 打开抖音',
        '抖音搜索 #关键词#',
        '打开抖音，看看这个视频'
      ];

      validTexts.forEach(text => {
        expect(isValidTikTokShareText(text)).toBe(true);
      });
    });

    it('should reject non-share text', () => {
      const invalidTexts = [
        'Just a normal text',
        'https://tiktok.com/video/123',
        'Watch this video'
      ];

      invalidTexts.forEach(text => {
        expect(isValidTikTokShareText(text)).toBe(false);
      });
    });
  });

  describe('extractUrlFromShareText', () => {
    it('should extract URL from share text', () => {
      const text = '复制此链接，打开抖音 https://vm.tiktok.com/ABC123 查看精彩内容';
      const url = extractUrlFromShareText(text);
      expect(url).toBe('https://vm.tiktok.com/ABC123');
    });

    it('should return null when no URL is found', () => {
      const text = '复制口令 #ABC123# 打开抖音';
      const url = extractUrlFromShareText(text);
      expect(url).toBeNull();
    });

    it('should extract the first URL when multiple exist', () => {
      const text = 'Visit https://first.com and https://second.com';
      const url = extractUrlFromShareText(text);
      expect(url).toBe('https://first.com');
    });
  });

  describe('detectInputType', () => {
    it('should detect URL input type', () => {
      expect(detectInputType('https://vm.tiktok.com/ABC123')).toBe('url');
      expect(detectInputType('  https://www.tiktok.com/@user/video/123  ')).toBe('url');
    });

    it('should detect share text input type', () => {
      expect(detectInputType('复制此链接，打开抖音')).toBe('sharetext');
      expect(detectInputType('  复制口令 #ABC# 打开抖音  ')).toBe('sharetext');
    });

    it('should detect invalid input type', () => {
      expect(detectInputType('random text')).toBe('invalid');
      expect(detectInputType('')).toBe('invalid');
      expect(detectInputType('   ')).toBe('invalid');
    });

    it('should prioritize URL detection over share text', () => {
      const input = 'https://vm.tiktok.com/ABC123 复制此链接，打开抖音';
      expect(detectInputType(input)).toBe('url');
    });
  });

  describe('isValidFileSize', () => {
    it('should validate file sizes within default limit', () => {
      expect(isValidFileSize(100 * 1024 * 1024)).toBe(true); // 100MB
      expect(isValidFileSize(500 * 1024 * 1024)).toBe(true); // 500MB
      expect(isValidFileSize(1)).toBe(true); // 1 byte
    });

    it('should reject invalid file sizes', () => {
      expect(isValidFileSize(501 * 1024 * 1024)).toBe(false); // 501MB
      expect(isValidFileSize(0)).toBe(false); // 0 bytes
      expect(isValidFileSize(-1)).toBe(false); // negative
    });

    it('should respect custom size limits', () => {
      expect(isValidFileSize(100 * 1024 * 1024, 50)).toBe(false); // 100MB with 50MB limit
      expect(isValidFileSize(30 * 1024 * 1024, 50)).toBe(true); // 30MB with 50MB limit
    });
  });

  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSessionId());
      }
      expect(ids.size).toBe(100); // All IDs should be unique
    });

    it('should follow the expected format', () => {
      const id = generateSessionId();
      expect(id).toMatch(/^session_\d+_[a-z0-9]{9}$/);
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const id = generateSessionId();
      const after = Date.now();
      
      const timestamp = parseInt(id.split('_')[1]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });
});