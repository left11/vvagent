/**
 * Validates if the input is a valid TikTok URL
 */
export function isValidTikTokUrl(url: string): boolean {
  const tiktokUrlPatterns = [
    /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
    /^https?:\/\/vm\.tiktok\.com\/[\w]+/,
    /^https?:\/\/vt\.tiktok\.com\/[\w]+/,
    /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w]+/
  ];

  return tiktokUrlPatterns.some(pattern => pattern.test(url));
}

/**
 * Validates if the input is a TikTok share text (口令)
 */
export function isValidTikTokShareText(text: string): boolean {
  // Check for common TikTok share text patterns in Chinese
  const shareTextPatterns = [
    /复制此链接，打开抖音/,
    /复制口令/,
    /抖音.*搜索/,
    /打开抖音.*看看/
  ];

  return shareTextPatterns.some(pattern => pattern.test(text));
}

/**
 * Extracts URL from TikTok share text
 */
export function extractUrlFromShareText(text: string): string | null {
  // Try to extract URL from the share text
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : null;
}

/**
 * Determines the input type (URL or share text)
 */
export function detectInputType(input: string): 'url' | 'sharetext' | 'invalid' {
  const trimmedInput = input.trim();
  
  if (isValidTikTokUrl(trimmedInput)) {
    return 'url';
  }
  
  if (isValidTikTokShareText(trimmedInput)) {
    return 'sharetext';
  }
  
  // Check if it contains any URL-like pattern
  if (/https?:\/\//.test(trimmedInput)) {
    return 'url';
  }
  
  return 'invalid';
}

/**
 * Validates file size is within limits
 */
export function isValidFileSize(sizeInBytes: number, maxSizeMB: number = 500): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeInBytes > 0 && sizeInBytes <= maxSizeBytes;
}

/**
 * Generates a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}