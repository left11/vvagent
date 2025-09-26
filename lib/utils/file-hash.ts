import crypto from 'crypto';
import fs from 'fs';

/**
 * Calculate MD5 hash of a file
 */
export async function calculateFileMD5(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('error', err => reject(err));
    
    stream.on('data', chunk => hash.update(chunk));
    
    stream.on('end', () => {
      const md5Hash = hash.digest('hex');
      resolve(md5Hash);
    });
  });
}

/**
 * Generate a unique filename based on MD5 hash
 * @param md5Hash - The MD5 hash of the file
 * @param originalExtension - The original file extension (e.g., '.mp4')
 * @returns Formatted filename like 'videos/md5hash.mp4'
 */
export function generateMD5Filename(md5Hash: string, originalExtension: string = '.mp4'): string {
  // Ensure extension starts with dot
  const ext = originalExtension.startsWith('.') ? originalExtension : `.${originalExtension}`;
  return `videos/${md5Hash}${ext}`;
}

/**
 * Extract MD5 from GCS filename
 * @param filename - The GCS filename (e.g., 'videos/abc123.mp4')
 * @returns The MD5 hash or null if not found
 */
export function extractMD5FromFilename(filename: string): string | null {
  const match = filename.match(/videos\/([a-f0-9]{32})\./);
  return match ? match[1] : null;
}