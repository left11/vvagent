#!/usr/bin/env node

/**
 * Test script for GCS upload functionality
 */

const fs = require('fs');
const path = require('path');

async function testGCSUpload() {
  console.log('🔧 Testing GCS Upload...\n');
  
  try {
    // Import the GCS service (using dynamic import for ES modules)
    const { default: gcsService } = await import('../lib/services/gcs-service.js');
    
    // Ensure bucket exists
    console.log('1️⃣ Checking bucket...');
    const bucketReady = await gcsService.ensureBucket();
    if (!bucketReady) {
      throw new Error('Failed to ensure bucket exists');
    }
    console.log('✅ Bucket is ready\n');
    
    // Create a test file
    console.log('2️⃣ Creating test file...');
    const testContent = `Test upload at ${new Date().toISOString()}`;
    const testFileName = `test_${Date.now()}.txt`;
    const testFilePath = path.join(process.cwd(), 'temp', testFileName);
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(testFilePath, testContent);
    console.log(`✅ Created test file: ${testFilePath}\n`);
    
    // Upload to GCS
    console.log('3️⃣ Uploading to GCS...');
    const uploadResult = await gcsService.uploadVideo(testFilePath, {
      filename: `test-uploads/${testFileName}`,
      metadata: {
        title: 'Test Upload',
        uploadedBy: 'test-script'
      }
    });
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }
    
    console.log('✅ Upload successful!');
    console.log(`📍 Public URL: ${uploadResult.publicUrl}`);
    console.log(`📦 GCS URI: ${uploadResult.gcsUri}\n`);
    
    // Clean up local file
    fs.unlinkSync(testFilePath);
    console.log('🧹 Cleaned up local test file\n');
    
    // List files in bucket
    console.log('4️⃣ Listing files in bucket...');
    const files = await gcsService.listFiles('test-uploads/');
    console.log(`Found ${files.length} test files:`);
    files.forEach(file => console.log(`  - ${file}`));
    
    console.log('\n✨ GCS upload test completed successfully!');
    console.log(`\n🔗 You can access the uploaded file at:\n   ${uploadResult.publicUrl}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testGCSUpload();