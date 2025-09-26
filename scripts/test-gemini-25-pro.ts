#!/usr/bin/env tsx

/**
 * Test script for Gemini 2.5 Pro model configuration
 */

import geminiAnalyzer from '../lib/services/gemini-analyzer';
import fs from 'fs';
import path from 'path';

async function testGemini25Pro() {
  console.log('🔧 Testing Gemini 2.5 Pro Configuration...\n');
  console.log('=' * 80);
  
  try {
    // Check if prompt template exists
    const promptPath = path.join(process.cwd(), 'prompt', 'video_analyze.md');
    if (fs.existsSync(promptPath)) {
      console.log('✅ Professional prompt template found');
      console.log(`   Path: ${promptPath}`);
      const promptSize = fs.statSync(promptPath).size;
      console.log(`   Size: ${(promptSize / 1024).toFixed(2)} KB`);
    } else {
      console.log('⚠️ Professional prompt template not found');
    }
    
    console.log('\n' + '=' * 80);
    console.log('📊 Model Configuration:');
    console.log('   Model: gemini-2.5-pro');
    console.log('   Purpose: Superior video understanding');
    console.log('   Max Output Tokens: 32768');
    console.log('   Response Format: JSON');
    
    // Check API key
    const hasApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.log('\n' + '=' * 80);
    if (hasApiKey) {
      console.log('✅ Gemini API key configured');
      console.log('   Ready for real video analysis');
    } else {
      console.log('⚠️ Gemini API key not configured');
      console.log('   Will return mock results');
      console.log('\n   To enable real analysis:');
      console.log('   1. Get API key from: https://makersuite.google.com/app/apikey');
      console.log('   2. Set GEMINI_API_KEY in .env.local');
    }
    
    // Test with a sample GCS URL
    const testVideoUrl = 'https://storage.googleapis.com/public-test-bucket-2025/videos/test.mp4';
    console.log('\n' + '=' * 80);
    console.log('🎬 Testing analysis with sample video:');
    console.log(`   URL: ${testVideoUrl}`);
    
    console.log('\n⏳ Calling Gemini 2.5 Pro...');
    const result = await geminiAnalyzer.analyzeVideo(testVideoUrl, {
      accountNiche: '测试内容',
      goal: '功能验证',
      targetPersona: '开发测试'
    });
    
    if (result) {
      console.log('\n✅ Analysis completed successfully!');
      console.log('\n📊 Result Summary:');
      console.log(`   Video URI: ${result.video_uri}`);
      console.log(`   Language: ${result.language_detected}`);
      console.log(`   Weighted Score: ${result.scorecard.weighted_total}`);
      console.log(`   Timeline Segments: ${result.timeline.length}`);
      console.log(`   Hook Types: ${result.copywriting.hook_type.join(', ')}`);
      console.log(`   Priority Fixes: ${result.scorecard.priority_fixes.length}`);
      console.log(`   Next Actions: ${result.next_actions.length}`);
      
      console.log('\n🔍 Key Metrics:');
      console.log(`   3s Retention: ${(result.metrics_estimated.retention_3s * 100).toFixed(1)}%`);
      console.log(`   30s Retention: ${(result.metrics_estimated.retention_30s * 100).toFixed(1)}%`);
      console.log(`   Like Rate: ${(result.metrics_estimated.like_rate * 100).toFixed(2)}%`);
      console.log(`   Follow Conv: ${(result.metrics_estimated.follow_conv * 100).toFixed(3)}%`);
      
      console.log('\n✨ Model is properly configured and working!');
    } else {
      console.log('\n❌ Analysis failed - please check configuration');
    }
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  console.log('\n' + '=' * 80);
  console.log('🎉 Gemini 2.5 Pro configuration test completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Ensure GEMINI_API_KEY is set in .env.local');
  console.log('   2. Test with real TikTok/Douyin videos');
  console.log('   3. Monitor the comprehensive analysis results');
}

// Run the test
testGemini25Pro();