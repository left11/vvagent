import { NextRequest, NextResponse } from 'next/server';
import snapAnyParser from '@/lib/services/snapany-parser';

/**
 * Simple API for Dify Agent integration
 * 
 * Input: { "input": "video url or share text" }
 * Output: { 
 *   "success": true/false,
 *   "data": {
 *     "url": "video direct url",
 *     "platform": "platform name",
 *     "title": "video title",
 *     "author": "author name",
 *     "cover": "cover image url"
 *   },
 *   "error": "error message if failed"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support both 'input' and 'text' as field names for flexibility
    const inputText = body.input || body.text || body.url || '';
    
    if (!inputText || typeof inputText !== 'string') {
      return NextResponse.json({
        success: false,
        data: null,
        error: 'Missing or invalid input text'
      }, { status: 400 });
    }
    
    // Extract URL from the input text
    const extractedUrl = snapAnyParser.extractUrl(inputText) || inputText;
    
    // Parse the video using SnapAny
    const result = await snapAnyParser.parseVideo(extractedUrl);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        data: null,
        error: result.error || 'Failed to parse video'
      });
    }
    
    // Return simplified data structure for Dify
    return NextResponse.json({
      success: true,
      data: {
        url: result.videoUrl || '',
        platform: result.platform || 'unknown',
        title: result.title || '',
        author: result.author || '',
        cover: result.coverUrl || '',
        // Include formats if available (for YouTube etc.)
        formats: result.formats || []
      },
      error: null
    });
    
  } catch (error) {
    console.error('[Simple API] Error:', error);
    return NextResponse.json({
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');
  
  if (!input) {
    return NextResponse.json({
      endpoint: '/api/v2/simple',
      description: 'Simple video parser API for Dify Agent integration',
      usage: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          input: 'video url or share text'
        }
      },
      response: {
        success: 'boolean',
        data: {
          url: 'video direct url',
          platform: 'platform name',
          title: 'video title (optional)',
          author: 'author name (optional)',
          cover: 'cover image url (optional)',
          formats: 'array of quality options (optional)'
        },
        error: 'error message or null'
      },
      example: {
        input: 'https://www.tiktok.com/@user/video/123456789',
        output: {
          success: true,
          data: {
            url: 'https://example.com/video.mp4',
            platform: 'tiktok',
            title: 'Video Title',
            author: '@username',
            cover: 'https://example.com/cover.jpg',
            formats: []
          },
          error: null
        }
      }
    });
  }
  
  // Process the input same as POST
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ input })
  }));
}