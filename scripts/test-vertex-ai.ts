#!/usr/bin/env tsx

/**
 * Test script for Vertex AI with Service Account authentication
 */

import geminiAnalyzer from '../lib/services/gemini-analyzer';
import fs from 'fs';
import path from 'path';

async function testVertexAI() {
  console.log('🔧 Testing Vertex AI with Service Account Configuration...\n');
  console.log('=' .repeat(80));
  
  try {
    // Check if service account file exists
    const serviceAccountPath = path.join(process.cwd(), 'config', 'public-service-220606-0ce909493107.json');
    if (fs.existsSync(serviceAccountPath)) {
      console.log('✅ Service Account file found');
      console.log(`   Path: ${serviceAccountPath}`);
      
      // Read and display service account info (without sensitive data)
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      console.log(`   Project ID: ${serviceAccount.project_id}`);
      console.log(`   Client Email: ${serviceAccount.client_email}`);
      console.log(`   Private Key ID: ${serviceAccount.private_key_id.substring(0, 10)}...`);
    } else {
      console.error('❌ Service Account file not found at:', serviceAccountPath);
      process.exit(1);
    }
    
    // Check if prompt template exists
    console.log('\n' + '=' .repeat(80));
    const promptPath = path.join(process.cwd(), 'prompt', 'video_analyze.md');
    if (fs.existsSync(promptPath)) {
      console.log('✅ Professional prompt template found');
      const promptSize = fs.statSync(promptPath).size;
      console.log(`   Size: ${(promptSize / 1024).toFixed(2)} KB`);
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 Vertex AI Configuration:');
    console.log('   Model: gemini-2.5-pro');
    console.log('   Location: us-central1');
    console.log('   Authentication: Service Account');
    console.log('   Response Format: JSON');
    console.log('   Max Output Tokens: 32768');
    
    // Test with a sample GCS URL
    const testVideoUrl = 'https://storage.googleapis.com/public-test-bucket-2025/videos/test.mp4';
    console.log('\n' + '=' .repeat(80));
    console.log('🎬 Testing analysis with sample video:');
    console.log(`   URL: ${testVideoUrl}`);
    
    console.log('\n⏳ Calling Gemini 2.5 Pro via Vertex AI...');
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
      
      console.log('\n🔍 Key Metrics:');
      console.log(`   3s Retention: ${(result.metrics_estimated.retention_3s * 100).toFixed(1)}%`);
      console.log(`   30s Retention: ${(result.metrics_estimated.retention_30s * 100).toFixed(1)}%`);
      console.log(`   Like Rate: ${(result.metrics_estimated.like_rate * 100).toFixed(2)}%`);
      
      console.log('\n✨ Vertex AI with Service Account is properly configured!');
    } else {
      console.log('\n❌ Analysis failed - please check configuration');
    }
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.message.includes('Application Default Credentials')) {
      console.error('\n⚠️ Authentication issue detected.');
      console.error('   Make sure the service account file has the necessary permissions:');
      console.error('   - Vertex AI User');
      console.error('   - Storage Object Viewer (for GCS videos)');
    }
    console.error(error.stack);
    process.exit(1);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('🎉 Vertex AI configuration test completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Ensure service account has Vertex AI permissions');
  console.log('   2. Test with real TikTok/Douyin videos');
  console.log('   3. Monitor the comprehensive analysis results');
}

// Run the test
testVertexAI();