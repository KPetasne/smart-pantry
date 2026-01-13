import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

const BUCKET_NAME = 'recipe-images';

export class StorageService {
  /**
   * Upload a compressed image to Supabase Storage
   * @param buffer - Image buffer from Gemini API
   * @param filename - Filename for the image (e.g., recipe-123-1234567890.jpg)
   * @returns Public URL of the uploaded image
   */
  static async uploadCompressedImage(buffer: Buffer, filename: string): Promise<string> {
    try {
      // Validate that buffer is a valid image
      const metadata = await sharp(buffer).metadata();
      
      if (!metadata.format) {
        throw new Error('Invalid image format');
      }

      console.log(`📸 Processing image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

      // Compress and resize image to 1024x768 JPEG with 80% quality
      const compressedBuffer = await sharp(buffer)
        .resize(1024, 768, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({
          quality: 80,
          mozjpeg: true, // Use mozjpeg for better compression
        })
        .toBuffer();

      const originalSize = buffer.length;
      const compressedSize = compressedBuffer.length;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
      
      console.log(`🗜️  Compressed: ${(originalSize / 1024).toFixed(2)}KB → ${(compressedSize / 1024).toFixed(2)}KB (${compressionRatio}% reduction)`);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filename, compressedBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '31536000', // Cache for 1 year
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filename);

      console.log(`✅ Uploaded to Supabase: ${publicUrlData.publicUrl}`);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Delete an image from Supabase Storage
   * @param imageUrl - Full public URL of the image
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      // URL format: https://xxx.supabase.co/storage/v1/object/public/recipe-images/filename.jpg
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];

      if (!filename) {
        throw new Error('Invalid image URL');
      }

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filename]);

      if (error) {
        throw new Error(`Supabase delete failed: ${error.message}`);
      }

      console.log(`🗑️  Deleted image: ${filename}`);
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Check if the bucket exists and is accessible
   */
  static async checkBucketExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
      
      if (error || !data) {
        console.error(`❌ Bucket '${BUCKET_NAME}' not found or not accessible`);
        return false;
      }

      console.log(`✅ Bucket '${BUCKET_NAME}' is accessible`);
      return true;
    } catch (error) {
      console.error('❌ Error checking bucket:', error);
      return false;
    }
  }
}
