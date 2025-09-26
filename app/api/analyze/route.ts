import { NextRequest } from 'next/server';
import tiktokParser from '@/lib/services/tiktok-parser';
import videoDownloader from '@/lib/services/video-downloader';
import gcsService from '@/lib/services/gcs-service';
import geminiAnalyzer from '@/lib/services/gemini-analyzer';
import { ProcessingStatus, AnalysisResult } from '@/lib/types';
import { exceedsDurationLimit, formatDuration, formatFileSize } from '@/lib/utils/format';
import { getVideoDuration } from '@/lib/utils/video-info';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Create a streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { input } = await request.json();
        
        // Send initial status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'parsing' as ProcessingStatus,
          progress: 0 
        })}\n\n`));
        
        // Step 1: Parse the URL
        const parseResult = await tiktokParser.parseInput(input);
        
        if (!parseResult.success) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            status: 'error' as ProcessingStatus,
            error: parseResult.error 
          })}\n\n`));
          return;
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'parsing' as ProcessingStatus,
          progress: 25,
          parsedUrl: parseResult.videoUrl 
        })}\n\n`));
        
        // Step 2: Download video
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'downloading' as ProcessingStatus,
          progress: 30 
        })}\n\n`));
        
        const filename = `${Date.now()}_${parseResult.metadata?.title || 'video'}.mp4`
          .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s\-_\.]/g, '_')
          .substring(0, 100);
        
        const downloadResult = await videoDownloader.downloadWithRetry(
          parseResult.videoUrl!,
          { 
            filename,
            onProgress: (progress) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                status: 'downloading' as ProcessingStatus,
                progress: 30 + Math.round(progress.percentage * 0.3)
              })}\n\n`));
            }
          }
        );
        
        if (!downloadResult.success || !downloadResult.filePath) {
          throw new Error(downloadResult.error || 'Download failed');
        }
        
        // Get accurate video duration using ffmpeg
        let actualDuration = 0;
        try {
          actualDuration = await getVideoDuration(downloadResult.filePath);
          console.log(`Actual video duration from ffmpeg: ${actualDuration} seconds (${formatDuration(actualDuration)})`);
          
          // Update parseResult with accurate duration
          if (actualDuration > 0) {
            parseResult.metadata = {
              ...parseResult.metadata,
              duration: actualDuration
            };
          }
        } catch (error) {
          console.warn('Could not get video duration with ffmpeg:', error);
        }
        
        // Step 3: Upload to Google Cloud Storage
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'uploading' as ProcessingStatus,
          progress: 60 
        })}\n\n`));
        
        const uploadResult = await gcsService.uploadVideo(
          downloadResult.filePath,
          {
            useMD5: true, // Use MD5 as filename for deduplication
            metadata: {
              title: parseResult.metadata?.title,
              author: parseResult.metadata?.author,
              videoId: parseResult.metadata?.videoId,
              originalUrl: input
            },
            onProgress: (progress) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                status: 'uploading' as ProcessingStatus,
                progress: 60 + Math.round(progress * 0.15)
              })}\n\n`));
            }
          }
        );
        
        // Log if file was duplicate
        if (uploadResult.isDuplicate) {
          console.log('Video already exists in GCS, skipping upload. MD5:', uploadResult.md5);
        }
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload to GCS failed');
        }
        
        // Send video info immediately after upload
        const videoDuration = parseResult.metadata?.duration || actualDuration || 0;
        const videoInfo = {
          id: parseResult.metadata?.videoId || 'video-' + Date.now(),
          originalUrl: input,
          title: parseResult.metadata?.title || '抖音视频',
          author: parseResult.metadata?.author,
          duration: videoDuration,
          downloadedAt: new Date(),
          gcsUrl: uploadResult.publicUrl || uploadResult.gcsUri,
          fileSize: downloadResult.fileSize || uploadResult.fileSize || 0
        };
        
        // Send video info event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'video_ready' as ProcessingStatus,
          progress: 75,
          videoInfo: videoInfo
        })}\n\n`));
        
        console.log('Video uploaded successfully:', videoInfo.gcsUrl);
        console.log('Video duration:', formatDuration(videoDuration));
        
        // Clean up local file after upload (always clean up, even for duplicates)
        const fs = await import('fs');
        if (fs.existsSync(downloadResult.filePath)) {
          fs.unlinkSync(downloadResult.filePath);
          console.log('Cleaned up local file:', downloadResult.filePath);
        }
        
        // Check if video exceeds 5-minute limit for analysis
        if (videoDuration && exceedsDurationLimit(videoDuration, 5)) {
          const duration = formatDuration(videoDuration);
          console.log(`Video duration ${duration} exceeds 5-minute limit, skipping Gemini analysis`);
          
          // Return result without analysis
          const analysisResult: AnalysisResult = {
            videoInfo: {
              id: parseResult.metadata?.videoId || 'video-' + Date.now(),
              originalUrl: input,
              title: parseResult.metadata?.title || '抖音视频',
              author: parseResult.metadata?.author,
              duration: videoDuration,
              downloadedAt: new Date(),
              gcsUrl: uploadResult.publicUrl || uploadResult.gcsUri,
              fileSize: downloadResult.fileSize || uploadResult.fileSize || 0
            },
            insights: {
              hooks: [],
              visualElements: [],
              audioAnalysis: '视频超过5分钟，跳过AI分析',
              pacing: '视频超过5分钟，跳过AI分析',
              engagementTactics: [],
              viralFactors: []
            },
            recommendations: [`视频时长 ${duration} 超过5分钟限制。建议：1) 剪辑成多个短视频 2) 提取精华片段 3) 制作预告片`]
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            status: 'completed' as ProcessingStatus,
            progress: 100,
            result: analysisResult,
            warning: `视频已成功上传到云存储，但因时长超过5分钟（${duration}），跳过AI分析` 
          })}\n\n`));
          return;
        }
        
        // Step 4: Analyze with Gemini AI
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'analyzing' as ProcessingStatus,
          progress: 80 
        })}\n\n`));
        
        // Call Gemini analyzer with the GCS URL and options
        console.log('\n' + '='.repeat(80));
        console.log('🎬 发起Gemini 2.5 Pro视频分析...');
        console.log(`   视频URL: ${uploadResult.publicUrl}`);
        console.log(`   视频时长: ${parseResult.metadata?.duration ? formatDuration(parseResult.metadata.duration) : 'Unknown'}`);
        console.log(`   文件大小: ${uploadResult.fileSize ? formatFileSize(uploadResult.fileSize) : 'Unknown'}`);
        console.log('='.repeat(80));
        
        const geminiResult = await geminiAnalyzer.analyzeVideo(
          uploadResult.publicUrl!,
          {
            accountNiche: '通用内容/短视频',
            goal: '涨粉/带货转化/品牌宣传',
            targetPersona: '18-35岁抖音核心用户群体',
            brandTone: '专业、有趣、年轻化',
            videoDuration: parseResult.metadata?.duration // Pass duration for double-check
          }
        );
        
        // Log analysis result summary
        console.log('\n🎆 分析结果摘要:');
        console.log(`   语言: ${geminiResult.language_detected}`);
        console.log(`   综合评分: ${geminiResult.scorecard?.weighted_total || 'N/A'}`);
        console.log(`   时间轴片段: ${geminiResult.timeline?.length || 0}`);
        console.log(`   Hook类型: ${geminiResult.copywriting?.hook_type?.length || 0}`);
        console.log(`   优先修复: ${geminiResult.scorecard?.priority_fixes?.length || 0}`);
        console.log(`   下一步行动: ${geminiResult.next_actions?.length || 0}`);
        
        // Transform Gemini result to our AnalysisResult format
        const analysisResult: AnalysisResult = {
          videoInfo: {
            id: parseResult.metadata?.videoId || 'analyzed-' + Date.now(),
            originalUrl: input,
            title: parseResult.metadata?.title || '抖音视频',
            author: parseResult.metadata?.author,
            duration: parseResult.metadata?.duration,
            downloadedAt: new Date(),
            gcsUrl: uploadResult.publicUrl || uploadResult.gcsUri,
            fileSize: downloadResult.fileSize || uploadResult.fileSize || 0
          },
          // Include full Gemini analysis result
          geminiAnalysis: geminiResult,
          // Extract key insights for backward compatibility
          insights: {
            hooks: geminiResult.copywriting?.hook_type || [],
            visualElements: geminiResult.visual?.focus_points || [],
            audioAnalysis: `BPM: ${geminiResult.metrics_estimated?.bpm_estimate || 'N/A'}, 剪辑节奏: ${geminiResult.metrics_estimated?.cuts_per_min || 'N/A'}次/分钟`,
            pacing: `平均镜头时长: ${geminiResult.metrics_estimated?.avg_shot_len_sec || 'N/A'}秒`,
            engagementTactics: geminiResult.emotion_value?.triggers || [],
            viralFactors: geminiResult.ab_tests?.map(t => t.hypothesis) || []
          },
          recommendations: [
            ...geminiResult.scorecard?.priority_fixes || [],
            ...geminiResult.next_actions || []
          ]
        };
        
        // Send completion
        console.log('\n✅ 分析完成，发送结果给客户端');
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'completed' as ProcessingStatus,
          progress: 100,
          result: analysisResult 
        })}\n\n`));
        
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          status: 'error' as ProcessingStatus,
          error: error instanceof Error ? error.message : '处理失败' 
        })}\n\n`));
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('url');
  
  if (!input) {
    return Response.json({ error: '请提供URL参数' }, { status: 400 });
  }
  
  try {
    const result = await tiktokParser.parseInput(input);
    return Response.json(result);
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : '解析失败' 
    }, { status: 500 });
  }
}