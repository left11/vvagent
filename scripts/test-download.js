#!/usr/bin/env node

/**
 * Test script for video download functionality
 * Usage: node scripts/test-download.js "share_text_or_url"
 */

const MOBILE_USER_AGENT = 
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/121.0.2277.107 ' +
  'Version/17.0 Mobile/15E148 Safari/604.1';

async function testParse(input) {
  console.log('\n📝 Testing URL parsing...');
  console.log('Input:', input);
  
  try {
    // Extract URL from input
    const urlMatch = input.match(/https?:\/\/[^\s]+/);
    if (!urlMatch) {
      throw new Error('No URL found in input');
    }
    
    const shareUrl = urlMatch[0];
    console.log('Extracted URL:', shareUrl);
    
    // Follow redirects to get final URL
    const response = await fetch(shareUrl, {
      method: 'GET',
      headers: {
        'User-Agent': MOBILE_USER_AGENT,
      },
      redirect: 'follow',
    });
    
    const finalUrl = response.url;
    console.log('Final URL after redirect:', finalUrl);
    
    // Extract video ID
    const videoId = finalUrl.split('/').pop()?.split('?')[0];
    console.log('Video ID:', videoId);
    
    // Fetch page content
    const pageUrl = `https://www.iesdouyin.com/share/video/${videoId}`;
    console.log('Fetching page:', pageUrl);
    
    const pageResponse = await fetch(pageUrl, {
      headers: {
        'User-Agent': MOBILE_USER_AGENT,
      },
    });
    
    const pageContent = await pageResponse.text();
    
    // Look for _ROUTER_DATA
    const routerDataMatch = pageContent.match(/window\._ROUTER_DATA\s*=\s*({.*?})<\/script>/s);
    
    if (routerDataMatch) {
      console.log('✅ Found _ROUTER_DATA');
      const data = JSON.parse(routerDataMatch[1]);
      
      // Extract video URL
      const possibleKeys = ['video_(id)/page', 'note_(id)/page'];
      for (const key of possibleKeys) {
        if (data.loaderData?.[key]?.videoInfoRes) {
          const item = data.loaderData[key].videoInfoRes.item_list[0];
          const videoUrl = item.video.play_addr.url_list[0];
          
          // Convert to no-watermark URL
          const downloadUrl = videoUrl.replace('playwm', 'play');
          
          console.log('\n🎥 Video Information:');
          console.log('Title:', item.desc || 'No title');
          console.log('Author:', item.author?.nickname || 'Unknown');
          console.log('Duration:', item.video.duration || 0, 'ms');
          console.log('\n🔗 URLs:');
          console.log('Original (with watermark):', videoUrl);
          console.log('Download (no watermark):', downloadUrl);
          
          return downloadUrl;
        }
      }
    }
    
    throw new Error('Could not extract video data from page');
    
  } catch (error) {
    console.error('❌ Parse error:', error.message);
    return null;
  }
}

async function testDownload(downloadUrl) {
  console.log('\n⬇️ Testing video download...');
  console.log('Download URL:', downloadUrl);
  
  try {
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'User-Agent': MOBILE_USER_AGENT,
        'Referer': 'https://www.douyin.com/',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    console.log('✅ Download successful!');
    console.log('Content-Type:', contentType);
    console.log('Content-Length:', contentLength ? `${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB` : 'Unknown');
    
    // Don't actually download the full video in test
    await response.body?.cancel();
    
    return true;
    
  } catch (error) {
    console.error('❌ Download error:', error.message);
    return false;
  }
}

async function main() {
  const input = process.argv[2];
  
  if (!input) {
    console.log('Usage: node scripts/test-download.js "share_text_or_url"');
    console.log('Example: node scripts/test-download.js "https://v.douyin.com/xxx"');
    process.exit(1);
  }
  
  console.log('🚀 Starting download test...');
  
  // Test parsing
  const downloadUrl = await testParse(input);
  
  if (downloadUrl) {
    // Test download
    await testDownload(downloadUrl);
  }
  
  console.log('\n✨ Test complete!');
}

main().catch(console.error);