import { NextRequest, NextResponse } from 'next/server';
import tiktokParser from '@/lib/services/tiktok-parser';
import videoDownloader from '@/lib/services/video-downloader';
import fs from 'fs';
import path from 'path';

/**
 * API route for downloading videos
 * Supports both direct download URLs and share text parsing
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shareText = searchParams.get('share');
  const directUrl = searchParams.get('url');
  
  try {
    let downloadUrl: string;
    let filename: string = 'douyin_video.mp4';
    
    if (directUrl) {
      // Use direct URL if provided
      downloadUrl = directUrl;
    } else if (shareText) {
      // Parse share text to get download URL
      console.log('Parsing share text:', shareText);
      const parseResult = await tiktokParser.parseInput(shareText);
      
      if (!parseResult.success || !parseResult.videoUrl) {
        return NextResponse.json(
          { error: parseResult.error || 'Failed to parse video URL' },
          { status: 400 }
        );
      }
      
      downloadUrl = parseResult.videoUrl;
      
      // Use video title as filename if available
      if (parseResult.metadata?.title) {
        // Sanitize filename
        filename = parseResult.metadata.title
          .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s\-_]/g, '_')
          .substring(0, 100) + '.mp4';
      }
    } else {
      return NextResponse.json(
        { error: 'Please provide either "share" or "url" parameter' },
        { status: 400 }
      );
    }
    
    console.log('Downloading from URL:', downloadUrl);
    
    // Download the video
    const downloadResult = await videoDownloader.downloadWithRetry(downloadUrl, {
      filename: `${Date.now()}_${filename}`,
    });
    
    if (!downloadResult.success || !downloadResult.filePath) {
      return NextResponse.json(
        { error: downloadResult.error || 'Download failed' },
        { status: 500 }
      );
    }
    
    // Read the downloaded file
    const fileBuffer = fs.readFileSync(downloadResult.filePath);
    
    // Clean up temp file after reading
    fs.unlinkSync(downloadResult.filePath);
    
    // Return the video file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
    
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for downloading with progress tracking
 */
export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();
    
    if (!input) {
      return NextResponse.json(
        { error: 'Please provide input (URL or share text)' },
        { status: 400 }
      );
    }
    
    // Parse the input
    console.log('Parsing input:', input);
    const parseResult = await tiktokParser.parseInput(input);
    
    if (!parseResult.success || !parseResult.videoUrl) {
      return NextResponse.json(
        { error: parseResult.error || 'Failed to parse video URL' },
        { status: 400 }
      );
    }
    
    const downloadUrl = parseResult.videoUrl;
    const metadata = parseResult.metadata;
    
    // Generate filename
    const timestamp = Date.now();
    const baseFilename = metadata?.title || 'douyin_video';
    const sanitizedFilename = baseFilename
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s\-_]/g, '_')
      .substring(0, 100);
    const filename = `${timestamp}_${sanitizedFilename}.mp4`;
    
    console.log('Starting download:', {
      url: downloadUrl,
      filename,
      title: metadata?.title,
    });
    
    // Download the video
    const downloadResult = await videoDownloader.downloadWithRetry(
      downloadUrl,
      { filename },
      3 // max retries
    );
    
    if (!downloadResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: downloadResult.error || 'Download failed' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      filePath: downloadResult.filePath,
      fileSize: downloadResult.fileSize,
      metadata: {
        title: metadata?.title,
        author: metadata?.author,
        duration: metadata?.duration,
        videoId: metadata?.videoId,
      },
    });
    
  } catch (error) {
    console.error('Download POST error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Download failed' 
      },
      { status: 500 }
    );
  }
}