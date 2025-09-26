import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
import { calculateFileMD5, generateMD5Filename } from '../utils/file-hash';

/**
 * Google Cloud Storage Service
 * Uploads videos to GCS bucket with public access
 */

export interface GCSUploadOptions {
  filename?: string;
  useMD5?: boolean; // Whether to use MD5 as filename
  metadata?: {
    title?: string;
    author?: string;
    videoId?: string;
    originalUrl?: string;
    md5?: string;
  };
  onProgress?: (progress: number) => void;
}

export interface GCSUploadResult {
  success: boolean;
  publicUrl?: string;
  gcsUri?: string;
  fileName?: string;
  fileSize?: number;
  md5?: string;
  isDuplicate?: boolean;
  error?: string;
}

export class GCSService {
  private storage: Storage;
  private bucketName: string;
  private bucket: any;

  constructor() {
    // Initialize Google Cloud Storage with service account
    const keyFilePath = path.join(process.cwd(), 'config', 'public-service-220606-0ce909493107.json');
    
    this.storage = new Storage({
      keyFilename: keyFilePath,
      projectId: 'public-service-220606'
    });
    
    // Use the same bucket as in the Python implementation
    this.bucketName = 'public-test-bucket-2025';
    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * Upload video file to GCS with MD5-based deduplication
   */
  async uploadVideo(
    filePath: string,
    options: GCSUploadOptions = {}
  ): Promise<GCSUploadResult> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found: ' + filePath);
      }

      const stats = fs.statSync(filePath);
      
      // Calculate MD5 hash of the file
      const md5Hash = await calculateFileMD5(filePath);
      console.log('File MD5 hash:', md5Hash);
      
      // Generate GCS filename based on MD5 or use provided filename
      let gcsFileName: string;
      if (options.useMD5 !== false) {
        // Default to using MD5 as filename
        const ext = path.extname(filePath);
        gcsFileName = generateMD5Filename(md5Hash, ext);
      } else if (options.filename) {
        gcsFileName = options.filename;
      } else {
        const timestamp = Date.now();
        const originalName = path.basename(filePath);
        gcsFileName = `videos/${timestamp}_${originalName}`;
      }
      
      // Check if file with same MD5 already exists
      const existingFile = await this.findFileByMD5(md5Hash);
      if (existingFile) {
        console.log('File with same MD5 already exists:', existingFile);
        const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${existingFile}`;
        const gcsUri = `gs://${this.bucketName}/${existingFile}`;
        
        return {
          success: true,
          publicUrl,
          gcsUri,
          fileName: existingFile,
          fileSize: stats.size,
          md5: md5Hash,
          isDuplicate: true
        };
      }
      
      console.log('Uploading to GCS:', {
        bucket: this.bucketName,
        fileName: gcsFileName,
        fileSize: stats.size
      });

      // Create file reference
      const file = this.bucket.file(gcsFileName);

      // Set metadata with MD5
      const metadata: any = {
        contentType: 'video/mp4',
        metadata: {
          uploadedAt: new Date().toISOString(),
          md5: md5Hash,
          ...options.metadata
        }
      };

      // Upload file using simpler approach like in Python implementation
      await file.save(fs.readFileSync(filePath), {
        metadata,
        resumable: true,
        validation: 'crc32c'
      });

      // Make the file publicly accessible
      await file.makePublic();
      
      // Report progress
      if (options.onProgress) {
        options.onProgress(100);
      }

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${gcsFileName}`;
      const gcsUri = `gs://${this.bucketName}/${gcsFileName}`;

      console.log('Upload successful:', publicUrl);

      return {
        success: true,
        publicUrl,
        gcsUri,
        fileName: gcsFileName,
        fileSize: stats.size,
        md5: md5Hash,
        isDuplicate: false
      };

    } catch (error) {
      console.error('GCS upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Check if file exists in GCS
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const file = this.bucket.file(fileName);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Delete file from GCS
   */
  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const file = this.bucket.file(fileName);
      await file.delete();
      console.log('File deleted:', fileName);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get signed URL for temporary private access (if needed)
   */
  async getSignedUrl(
    fileName: string, 
    expirationMinutes: number = 60
  ): Promise<string | null> {
    try {
      const file = this.bucket.file(fileName);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expirationMinutes * 60 * 1000
      });
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  }

  /**
   * List files in bucket (for management)
   */
  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const options: any = {};
      if (prefix) {
        options.prefix = prefix;
      }
      
      const [files] = await this.bucket.getFiles(options);
      return files.map(file => file.name);
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Get bucket info
   */
  async getBucketInfo() {
    try {
      const [metadata] = await this.bucket.getMetadata();
      return {
        name: metadata.name,
        location: metadata.location,
        storageClass: metadata.storageClass,
        publicAccess: metadata.iamConfiguration?.publicAccessPrevention === 'inherited'
      };
    } catch (error) {
      console.error('Error getting bucket info:', error);
      return null;
    }
  }

  /**
   * Find file by MD5 hash in metadata
   */
  async findFileByMD5(md5Hash: string): Promise<string | null> {
    try {
      // First try to find file with MD5 in filename
      const md5Filename = generateMD5Filename(md5Hash, '.mp4');
      const [exists] = await this.bucket.file(md5Filename).exists();
      if (exists) {
        return md5Filename;
      }
      
      // If not found by filename, search in metadata
      const [files] = await this.bucket.getFiles({
        prefix: 'videos/',
        maxResults: 1000 // Limit search to recent files
      });
      
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        if (metadata.metadata?.md5 === md5Hash) {
          return file.name;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error searching for file by MD5:', error);
      return null;
    }
  }

  /**
   * Ensure bucket exists and is configured correctly
   */
  async ensureBucket(): Promise<boolean> {
    try {
      const [exists] = await this.bucket.exists();
      
      if (!exists) {
        console.log('Creating bucket:', this.bucketName);
        // Create bucket with same settings as Python implementation
        const [bucket] = await this.storage.createBucket(this.bucketName, {
          location: 'US',
          storageClass: 'STANDARD'
        });
        
        // Make bucket and future objects public
        await bucket.makePublic({ includeFiles: true });
        console.log('Bucket created and made public');
      } else {
        console.log('Bucket already exists:', this.bucketName);
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring bucket:', error);
      // If bucket already exists, that's fine
      if ((error as any).code === 409) {
        console.log('Bucket already exists (409), continuing...');
        return true;
      }
      return false;
    }
  }
}

// Export singleton instance
export default new GCSService();