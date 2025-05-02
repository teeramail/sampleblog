import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { env } from "~/env";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

// Maximum file sizes in bytes
const MAX_THUMBNAIL_SIZE = 30 * 1024; // 30KB
const MAX_IMAGE_SIZE = 120 * 1024; // 120KB

// Check for AWS configuration
const isAwsConfigured = env.AWS_REGION && 
  env.AWS_ENDPOINT && 
  env.AWS_ACCESS_KEY_ID && 
  env.AWS_SECRET_ACCESS_KEY && 
  env.AWS_S3_BUCKET && 
  env.AWS_PUBLIC_URL;

// Log warning if AWS is not configured
if (!isAwsConfigured && env.NODE_ENV !== 'production') {
  console.warn('AWS configuration is incomplete. Image upload features will be mocked in development mode.');
}

// S3 client - only initialize if AWS is configured
let s3Client: S3Client | null = null;

if (isAwsConfigured) {
  s3Client = new S3Client({
    region: env.AWS_REGION as string,
    endpoint: env.AWS_ENDPOINT as string,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
}

/**
 * Process and upload a thumbnail image
 * Automatically resizes if the image is larger than 30KB
 */
export async function processThumbnail(
  file: Buffer,
  contentType: string,
  topicId: string,
): Promise<string> {
  // Process the image with sharp
  let processedImage = sharp(file);
  let imageBuffer = await processedImage.toBuffer();
  
  // Check if the image is too large
  if (imageBuffer.length > MAX_THUMBNAIL_SIZE) {
    // Get image metadata
    const metadata = await processedImage.metadata();
    const width = metadata.width ?? 800;
    const height = metadata.height ?? 600;
    
    // Start with 80% quality
    let quality = 80;
    let resizeRatio = 1;
    
    // Try resizing and reducing quality until the image is small enough
    while (imageBuffer.length > MAX_THUMBNAIL_SIZE && (quality > 10 || resizeRatio > 0.1)) {
      if (quality > 10) {
        // Reduce quality first
        quality -= 10;
      } else {
        // Then start reducing size
        resizeRatio *= 0.9;
      }
      
      // Resize and compress
      processedImage = sharp(file)
        .resize({
          width: Math.round(width * resizeRatio),
          height: Math.round(height * resizeRatio),
          fit: 'inside',
        })
        .jpeg({ quality });
      
      imageBuffer = await processedImage.toBuffer();
    }
  }
  
  // Generate filename
  const filename = `${uuidv4()}.jpg`;
  const rootFolder = env.AWS_S3_ROOT_FOLDER || 'realland-app';
  const key = `${rootFolder}/topics/${topicId}/thumbnail/${filename}`;
  
  // If AWS is configured, upload to S3
  if (isAwsConfigured && s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET as string,
        Key: key,
        Body: imageBuffer,
        ContentType: "image/jpeg",
        ACL: "public-read",
      })
    );
    
    // Return the public URL
    const publicUrl = env.AWS_PUBLIC_URL;
    if (!publicUrl) {
      throw new Error('AWS_PUBLIC_URL is not defined in environment variables');
    }
    return `${publicUrl}/${key}`;
  } else {
    // In development mode without AWS, return a mock URL
    console.log(`[DEV] Processed thumbnail for topic ${topicId}, size: ${imageBuffer.length} bytes`);
    return `https://mock-s3.example.com/${key}`;
  }
}

/**
 * Process and upload a regular image
 * Automatically resizes if the image is larger than 120KB
 */
export async function processImage(
  file: Buffer,
  contentType: string,
  topicId: string,
  postId: string,
): Promise<string> {
  // Process the image with sharp
  let processedImage = sharp(file);
  let imageBuffer = await processedImage.toBuffer();
  
  // Check if the image is too large
  if (imageBuffer.length > MAX_IMAGE_SIZE) {
    // Get image metadata
    const metadata = await processedImage.metadata();
    const width = metadata.width ?? 1200;
    const height = metadata.height ?? 900;
    
    // Start with 80% quality
    let quality = 80;
    let resizeRatio = 1;
    
    // Try resizing and reducing quality until the image is small enough
    while (imageBuffer.length > MAX_IMAGE_SIZE && (quality > 10 || resizeRatio > 0.1)) {
      if (quality > 10) {
        // Reduce quality first
        quality -= 10;
      } else {
        // Then start reducing size
        resizeRatio *= 0.9;
      }
      
      // Resize and compress
      processedImage = sharp(file)
        .resize({
          width: Math.round(width * resizeRatio),
          height: Math.round(height * resizeRatio),
          fit: 'inside',
        })
        .jpeg({ quality });
      
      imageBuffer = await processedImage.toBuffer();
    }
  }
  
  // Generate filename
  const filename = `${uuidv4()}.jpg`;
  const rootFolder = env.AWS_S3_ROOT_FOLDER || 'realland-app';
  // Ensure postId is defined
  if (!postId) {
    throw new Error('Post ID is required for image processing');
  }
  const key = `${rootFolder}/topics/${topicId}/posts/${postId}/${filename}`;
  
  // If AWS is configured, upload to S3
  if (isAwsConfigured && s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET as string,
        Key: key,
        Body: imageBuffer,
        ContentType: "image/jpeg",
        ACL: "public-read",
      })
    );
    
    // Return the public URL
    const publicUrl = env.AWS_PUBLIC_URL;
    if (!publicUrl) {
      throw new Error('AWS_PUBLIC_URL is not defined in environment variables');
    }
    return `${publicUrl}/${key}`;
  } else {
    // In development mode without AWS, return a mock URL
    console.log(`[DEV] Processed image for topic ${topicId}, post ${postId}, size: ${imageBuffer.length} bytes`);
    return `https://mock-s3.example.com/${key}`;
  }
}

/**
 * Process and upload multiple images
 */
export async function processImages(
  files: Buffer[],
  contentTypes: string[],
  topicId: string,
  postId: string,
): Promise<string[]> {
  // Validate inputs
  if (!postId) {
    throw new Error("Post ID is required for processing multiple images");
  }
  
  if (!files || !contentTypes || files.length !== contentTypes.length) {
    throw new Error("Files and content types must be provided and have the same length");
  }
  
  const urls: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    if (!files[i]) {
      console.warn(`Skipping undefined file at index ${i}`);
      continue;
    }
    const url = await processImage(files[i], contentTypes[i] || 'image/jpeg', topicId, postId);
    urls.push(url);
  }
  
  return urls;
}

/**
 * Process base64 encoded image data
 */
export async function processBase64Image(
  base64Data: string,
  isThumb: boolean,
  topicId: string,
  postId?: string,
): Promise<string> {
  // Extract the base64 content
  const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 image data");
  }
  
  // Ensure we have valid content type and base64 data
  const contentType = matches[1];
  const base64Content = matches[2];
  if (!contentType || !base64Content) {
    throw new Error("Invalid base64 image format");
  }
  
  const buffer = Buffer.from(base64Content, 'base64');
  
  if (isThumb) {
    return processThumbnail(buffer, contentType, topicId);
  } else {
    if (!postId) {
      throw new Error("Post ID is required for regular images");
    }
    return processImage(buffer, contentType, topicId, postId);
  }
}

/**
 * Process multiple base64 encoded images
 */
export async function processBase64Images(
  base64DataArray: string[],
  topicId: string,
  postId: string,
): Promise<string[]> {
  if (!postId) {
    throw new Error("Post ID is required for processing multiple images");
  }
  
  const urls: string[] = [];
  
  for (const base64Data of base64DataArray) {
    const url = await processBase64Image(base64Data, false, topicId, postId);
    urls.push(url);
  }
  
  return urls;
}
