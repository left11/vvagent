import { NextRequest, NextResponse } from 'next/server';
import snapAnyParser from '@/lib/services/snapany-parser';
import type { ParseResult } from '@/lib/services/snapany-parser';



export async function POST(request: NextRequest) {
  try {
    const { url: inputUrl } = await request.json();
    
    if (!inputUrl) {
      return NextResponse.json(
        { success: false, platform: 'unknown', error: '请提供视频链接' },
        { status: 400 }
      );
    }
    
    // 提取URL（支持分享文本）
    const url = snapAnyParser.extractUrl(inputUrl) || inputUrl;
    
    // 使用 SnapAny 解析视频
    const result = await snapAnyParser.parseVideo(url);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[V2 API] Parse error:', error);
    return NextResponse.json(
      { 
        success: false, 
        platform: 'unknown', 
        error: error instanceof Error ? error.message : '解析失败' 
      },
      { status: 500 }
    );
  }
}

// GET 方法用于测试
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({
      message: 'V2 Parse API (SnapAny)',
      usage: 'POST /api/v2/parse with { url: "video_url" }',
      supportedPlatforms: [
        'douyin', 'tiktok', 'youtube', 
        'instagram', 'bilibili',
        'facebook', 'twitter'
      ],
      note: 'Powered by SnapAny API for multi-platform video parsing'
    });
  }
  
  // 使用 SnapAny 解析
  const extractedUrl = snapAnyParser.extractUrl(url) || url;
  const result = await snapAnyParser.parseVideo(extractedUrl);
  return NextResponse.json(result);
}