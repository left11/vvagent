import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || `video_${Date.now()}.mp4`;
  
  if (!videoUrl) {
    return NextResponse.json(
      { error: 'Missing video URL' },
      { status: 400 }
    );
  }
  
  try {
    // Fetch video from the URL
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }
    
    // Get the content type
    const contentType = response.headers.get('content-type') || 'video/mp4';
    
    // Stream the video back to client with download headers
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[Download API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download video' },
      { status: 500 }
    );
  }
}