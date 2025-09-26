import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Get video duration using ffmpeg
 * @param filePath - Path to the video file
 * @returns Duration in seconds
 */
export async function getVideoDuration(filePath: string): Promise<number> {
  try {
    // Use ffprobe to get video duration in seconds
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    
    const duration = parseFloat(stdout.trim());
    
    if (isNaN(duration)) {
      console.warn('Could not parse video duration from ffprobe output:', stdout);
      return 0;
    }
    
    console.log(`Video duration from ffprobe: ${duration} seconds`);
    return Math.round(duration);
  } catch (error) {
    console.error('Error getting video duration with ffprobe:', error);
    
    // Fallback: try with ffmpeg
    try {
      const { stderr } = await execAsync(
        `ffmpeg -i "${filePath}" 2>&1 | grep "Duration" | cut -d ' ' -f 4 | sed s/,//`
      );
      
      // Parse duration from format: HH:MM:SS.ms
      const match = stderr.match(/(\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        console.log(`Video duration from ffmpeg: ${totalSeconds} seconds`);
        return totalSeconds;
      }
    } catch (fallbackError) {
      console.error('Fallback ffmpeg duration check also failed:', fallbackError);
    }
    
    return 0;
  }
}

/**
 * Get detailed video information using ffprobe
 */
export async function getVideoInfo(filePath: string): Promise<{
  duration: number;
  width?: number;
  height?: number;
  bitrate?: number;
  codec?: string;
}> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
    );
    
    const info = JSON.parse(stdout);
    const videoStream = info.streams?.find((s: any) => s.codec_type === 'video');
    
    return {
      duration: Math.round(parseFloat(info.format?.duration || '0')),
      width: videoStream?.width,
      height: videoStream?.height,
      bitrate: parseInt(info.format?.bit_rate || '0', 10),
      codec: videoStream?.codec_name
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    return { duration: 0 };
  }
}