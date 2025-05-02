import sharp from 'sharp';

/**
 * Optimizes an image by converting it to WebP format and resizing it
 * 
 * @param buffer The image buffer to optimize
 * @param maxWidth The maximum width of the image
 * @param quality The quality of the WebP image (1-100)
 * @param isThumbnail Whether this is a thumbnail image (affects size limits)
 * @returns A Promise resolving to the optimized image buffer
 */
export async function optimizeImage(
  buffer: Buffer,
  maxWidth: number = 1200,
  quality: number = 80,
  isThumbnail: boolean = false
): Promise<Buffer> {
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Determine target width (keeping aspect ratio)
    const width = metadata.width && metadata.width > maxWidth ? maxWidth : metadata.width;
    
    // Create a sharp instance with the buffer
    let sharpInstance = sharp(buffer);
    
    // Resize if needed
    if (width) {
      sharpInstance = sharpInstance.resize({ width, withoutEnlargement: true });
    }
    
    // Set size limits based on whether this is a thumbnail
    const sizeLimit = isThumbnail ? 50 * 1024 : 120 * 1024; // 50KB for thumbnails, 120KB for regular images
    let currentQuality = isThumbnail ? 70 : 80; // Start with different quality settings
    let optimizedBuffer: Buffer;
    
    // Try progressively lower quality settings until we get under the size limit
    do {
      optimizedBuffer = await sharpInstance
        .webp({ quality: currentQuality })
        .toBuffer();
      
      // If still too large, reduce quality and try again
      if (optimizedBuffer.length > sizeLimit) {
        currentQuality -= 10;
        // Don't go below 30 quality
        if (currentQuality < 30) {
          // If we've reached minimum quality, try more aggressive resizing
          const newWidth = Math.floor((width || 1000) * 0.8); // Reduce to 80% of current width
          sharpInstance = sharp(buffer).resize({ width: newWidth, withoutEnlargement: true });
          currentQuality = isThumbnail ? 50 : 60; // Reset quality to a moderate level
        }
      }
    } while (optimizedBuffer.length > sizeLimit && currentQuality >= 30);
    
    // If we still couldn't get it under the limit, use the smallest version we have
    return optimizedBuffer;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw new Error('Failed to optimize image');
  }
}

// Define a simple interface for uploaded files to avoid Express dependency
interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Processes multiple images for upload
 * 
 * @param files Array of files to process
 * @param thumbnailIndex Index of the thumbnail image
 * @returns Array of optimized image URLs
 */
export async function processImages(
  files: UploadedFile[],
  thumbnailIndex: number = 0
): Promise<string[]> {
  const processedUrls: string[] = [];
  
  // In a real implementation, this would upload to S3 or another storage service
  // For now, we'll just return placeholder URLs
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue; // Skip if file is undefined
    
    const isThumbnail = i === thumbnailIndex;
    
    try {
      // Optimize the image
      const optimizedBuffer = await optimizeImage(
        file.buffer,
        isThumbnail ? 600 : 1200, // Thumbnails can be smaller
        80,
        isThumbnail
      );
      
      // In a real implementation, upload the optimized buffer to S3
      // For now, return a placeholder URL
      const fileName = file.originalname || `image-${i}`;
      const placeholderUrl = `https://example.com/images/${fileName}-${Date.now()}.webp`;
      processedUrls.push(placeholderUrl);
    } catch (error) {
      const fileName = file.originalname || `image-${i}`;
      console.error(`Error processing image ${fileName}:`, error);
      // Continue with other images
    }
  }
  
  return processedUrls;
}
