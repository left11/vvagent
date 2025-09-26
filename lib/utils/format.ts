/**
 * Format utilities for display
 */

/**
 * Format duration from seconds to human readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1:23" or "5:45")
 */
export function formatDuration(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  // For videos longer than 60 minutes, show hours
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
  
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Format file size to human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Check if video duration exceeds limit
 * @param seconds - Duration in seconds
 * @param limitMinutes - Limit in minutes (default 5)
 * @returns true if duration exceeds limit
 */
export function exceedsDurationLimit(seconds: number | undefined, limitMinutes: number = 5): boolean {
  if (!seconds) return false;
  return seconds > limitMinutes * 60;
}