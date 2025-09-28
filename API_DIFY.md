# Dify Agent API Documentation

## Endpoint
```
POST /api/v2/simple
```

## Description
Simple video parser API designed for Dify Agent integration. Accepts video URLs or share text and returns parsed video information.

## Request

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Body
```json
{
  "input": "video url or share text"
}
```

**Note**: The API also accepts `text` or `url` as field names for flexibility.

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/video.mp4",
    "platform": "tiktok",
    "title": "Video Title",
    "author": "@username",
    "cover": "https://example.com/cover.jpg",
    "formats": []
  },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": "Error message describing what went wrong"
}
```

## Field Descriptions

### Request Fields
- `input` (string, required): Can be:
  - Direct video URL: `https://www.tiktok.com/@user/video/123`
  - Share text with URL: `Check out this video: https://...`
  - Mixed text content containing a video URL

### Response Fields
- `success` (boolean): Whether the parsing was successful
- `data` (object or null): Contains parsed video information when successful
  - `url` (string): Direct video URL without watermark
  - `platform` (string): Platform name (tiktok, douyin, youtube, instagram, bilibili, etc.)
  - `title` (string): Video title (may be empty)
  - `author` (string): Video author/creator (may be empty)
  - `cover` (string): Video cover/thumbnail image URL (may be empty)
  - `formats` (array): Available quality options for platforms like YouTube
- `error` (string or null): Error message when parsing fails

## Supported Platforms
- TikTok
- Douyin (抖音)
- YouTube
- Instagram
- Bilibili (B站)
- Facebook
- Twitter

## Examples

### Example 1: TikTok Video
**Request:**
```bash
curl -X POST https://your-domain.com/api/v2/simple \
  -H "Content-Type: application/json" \
  -d '{"input": "https://www.tiktok.com/@username/video/7123456789"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://v16-webapp.tiktok.com/video.mp4",
    "platform": "tiktok",
    "title": "Amazing dance video",
    "author": "@username",
    "cover": "https://p16-sign.tiktok.com/cover.jpeg",
    "formats": []
  },
  "error": null
}
```

### Example 2: YouTube Video with Multiple Formats
**Request:**
```bash
curl -X POST https://your-domain.com/api/v2/simple \
  -H "Content-Type: application/json" \
  -d '{"input": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://rr1---sn-example.googlevideo.com/video.mp4",
    "platform": "youtube",
    "title": "Rick Astley - Never Gonna Give You Up",
    "author": "Rick Astley",
    "cover": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "formats": [
      {
        "quality": "1080p",
        "url": "https://example.com/1080p.mp4",
        "size": 104857600
      },
      {
        "quality": "720p",
        "url": "https://example.com/720p.mp4",
        "size": 52428800
      }
    ]
  },
  "error": null
}
```

### Example 3: Share Text with URL
**Request:**
```bash
curl -X POST https://your-domain.com/api/v2/simple \
  -H "Content-Type: application/json" \
  -d '{"input": "看看这个有趣的视频 https://v.douyin.com/ABC123/ 太搞笑了！"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://v.douyin.com/video.mp4",
    "platform": "douyin",
    "title": "搞笑视频",
    "author": "创作者",
    "cover": "",
    "formats": []
  },
  "error": null
}
```

### Example 4: Error Response
**Request:**
```bash
curl -X POST https://your-domain.com/api/v2/simple \
  -H "Content-Type: application/json" \
  -d '{"input": "not a valid url"}'
```

**Response:**
```json
{
  "success": false,
  "data": null,
  "error": "无法识别该链接的平台，请检查链接是否正确"
}
```

## Integration with Dify

### Setting up in Dify Workflow

1. **Add HTTP Request Node**
   - Method: POST
   - URL: `https://your-domain.com/api/v2/simple`
   - Headers: 
     ```json
     {
       "Content-Type": "application/json"
     }
     ```
   - Body:
     ```json
     {
       "input": "{{user_input}}"
     }
     ```

2. **Parse Response**
   - Use JSON Parser to extract `data.url` for video URL
   - Check `success` field for error handling
   - Use `data.platform` for platform-specific logic

3. **Error Handling**
   - If `success` is false, display `error` message to user
   - If `data.url` is empty, handle as parsing failure

### Dify Agent Prompt Example
```
You are a video download assistant. When users share video links or text containing video links, use the video parser API to extract the direct download link.

API Response format:
- success: boolean indicating if parsing succeeded
- data.url: direct video URL
- data.platform: video platform
- error: error message if failed

Provide the parsed video URL to users and explain how to download it.
```

## Rate Limiting
- Default: 100 requests per minute per IP
- For higher limits, please contact support

## Testing
You can test the API directly in your browser:
```
GET /api/v2/simple
```
This will return the API documentation and usage information.

To test with a video URL:
```
GET /api/v2/simple?input=https://www.tiktok.com/@user/video/123
```

## Error Codes
- `400`: Bad Request - Missing or invalid input
- `500`: Internal Server Error - Server-side parsing error
- `200`: Success - Even when parsing fails, returns 200 with success=false

## Notes
- The API automatically extracts URLs from share text
- Watermark removal is handled automatically for supported platforms
- Response time typically 1-3 seconds depending on platform
- All URLs returned are direct video URLs ready for download