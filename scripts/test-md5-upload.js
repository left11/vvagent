#!/usr/bin/env node

/**
 * Test script for MD5-based GCS upload deduplication
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function testMD5Upload() {
  console.log('🔧 Testing MD5-based Upload Deduplication...\n');
  
  try {
    // Import the services
    const { default: gcsService } = await import('../lib/services/gcs-service.js');
    const { calculateFileMD5 } = await import('../lib/utils/file-hash.js');
    
    // Ensure bucket exists
    console.log('1️⃣ Checking bucket...');
    const bucketReady = await gcsService.ensureBucket();
    if (!bucketReady) {
      throw new Error('Failed to ensure bucket exists');
    }
    console.log('✅ Bucket is ready\n');
    
    // Create a test video file
    console.log('2️⃣ Creating test video file...');
    const testContent = Buffer.from(`Test video content at ${new Date().toISOString()}`);
    const testFileName = `test_video_${Date.now()}.mp4`;
    const testFilePath = path.join(process.cwd(), 'temp', testFileName);
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(testFilePath, testContent);
    console.log(`✅ Created test file: ${testFilePath}`);
    
    // Calculate MD5
    const md5Hash = await calculateFileMD5(testFilePath);
    console.log(`📊 File MD5: ${md5Hash}\n`);
    
    // First upload
    console.log('3️⃣ First upload (should upload new file)...');
    const firstUpload = await gcsService.uploadVideo(testFilePath, {
      useMD5: true,
      metadata: {
        title: 'Test Video - First Upload',
        uploadedBy: 'test-script'
      }
    });
    
    if (!firstUpload.success) {
      throw new Error(firstUpload.error || 'First upload failed');
    }
    
    console.log('✅ First upload results:');
    console.log(`   - Public URL: ${firstUpload.publicUrl}`);
    console.log(`   - GCS URI: ${firstUpload.gcsUri}`);
    console.log(`   - MD5: ${firstUpload.md5}`);
    console.log(`   - Is Duplicate: ${firstUpload.isDuplicate}`);
    console.log();
    
    // Create another file with same content (same MD5)
    console.log('4️⃣ Creating duplicate content file...');
    const duplicateFileName = `duplicate_video_${Date.now()}.mp4`;
    const duplicateFilePath = path.join(tempDir, duplicateFileName);
    fs.writeFileSync(duplicateFilePath, testContent); // Same content = same MD5
    
    const duplicateMD5 = await calculateFileMD5(duplicateFilePath);
    console.log(`📊 Duplicate file MD5: ${duplicateMD5}`);
    console.log(`✅ MD5 match: ${md5Hash === duplicateMD5}\n`);
    
    // Second upload (should detect duplicate)
    console.log('5️⃣ Second upload (should detect duplicate)...');
    const secondUpload = await gcsService.uploadVideo(duplicateFilePath, {
      useMD5: true,
      metadata: {
        title: 'Test Video - Duplicate Upload',
        uploadedBy: 'test-script'
      }
    });
    
    if (!secondUpload.success) {
      throw new Error(secondUpload.error || 'Second upload failed');
    }
    
    console.log('✅ Second upload results:');
    console.log(`   - Public URL: ${secondUpload.publicUrl}`);
    console.log(`   - GCS URI: ${secondUpload.gcsUri}`);
    console.log(`   - MD5: ${secondUpload.md5}`);
    console.log(`   - Is Duplicate: ${secondUpload.isDuplicate}`);
    console.log();
    
    // Verify deduplication worked
    if (secondUpload.isDuplicate) {
      console.log('✅ Deduplication successful! Second upload returned existing file.');
    } else {
      console.log('⚠️ Warning: Deduplication did not work as expected.');
    }
    
    // Create a file with different content
    console.log('\n6️⃣ Creating file with different content...');
    const differentContent = Buffer.from(`Different content at ${Date.now()}`);
    const differentFileName = `different_video_${Date.now()}.mp4`;
    const differentFilePath = path.join(tempDir, differentFileName);
    fs.writeFileSync(differentFilePath, differentContent);
    
    const differentMD5 = await calculateFileMD5(differentFilePath);
    console.log(`📊 Different file MD5: ${differentMD5}`);
    console.log(`✅ MD5 different: ${md5Hash !== differentMD5}\n`);
    
    // Third upload (should upload as new file)
    console.log('7️⃣ Third upload (different content, should upload)...');
    const thirdUpload = await gcsService.uploadVideo(differentFilePath, {
      useMD5: true,
      metadata: {
        title: 'Test Video - Different Content',
        uploadedBy: 'test-script'
      }
    });
    
    if (!thirdUpload.success) {
      throw new Error(thirdUpload.error || 'Third upload failed');
    }
    
    console.log('✅ Third upload results:');
    console.log(`   - Public URL: ${thirdUpload.publicUrl}`);
    console.log(`   - GCS URI: ${thirdUpload.gcsUri}`);
    console.log(`   - MD5: ${thirdUpload.md5}`);
    console.log(`   - Is Duplicate: ${thirdUpload.isDuplicate}`);
    console.log();
    
    // Clean up local files
    console.log('8️⃣ Cleaning up local test files...');
    fs.unlinkSync(testFilePath);
    fs.unlinkSync(duplicateFilePath);
    fs.unlinkSync(differentFilePath);
    console.log('✅ Local files cleaned up\n');
    
    // List uploaded files
    console.log('9️⃣ Listing uploaded test files...');
    const files = await gcsService.listFiles('videos/');
    const testFiles = files.filter(f => f.includes(md5Hash) || f.includes(differentMD5));
    console.log(`Found ${testFiles.length} test files with MD5 in name:`);
    testFiles.forEach(file => console.log(`  - ${file}`));
    
    // Summary
    console.log('\n✨ MD5 Upload Deduplication Test Summary:');
    console.log('   1. First upload: New file uploaded ✅');
    console.log(`   2. Duplicate upload: ${secondUpload.isDuplicate ? 'Detected and skipped ✅' : 'Failed to detect ❌'}`);
    console.log(`   3. Different content: ${!thirdUpload.isDuplicate ? 'Uploaded as new file ✅' : 'Incorrectly marked as duplicate ❌'}`);
    
    const allTestsPassed = secondUpload.isDuplicate && !thirdUpload.isDuplicate;
    if (allTestsPassed) {
      console.log('\n🎉 All deduplication tests passed!');
    } else {
      console.log('\n⚠️ Some tests did not pass as expected.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testMD5Upload();