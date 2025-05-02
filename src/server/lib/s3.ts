import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { env } from "~/env";

// Check for AWS configuration
const isAwsConfigured = env.AWS_REGION && 
  env.AWS_ENDPOINT && 
  env.AWS_ACCESS_KEY_ID && 
  env.AWS_SECRET_ACCESS_KEY && 
  env.AWS_S3_BUCKET;

// Log warning if AWS is not configured
if (!isAwsConfigured && env.NODE_ENV !== 'production') {
  console.warn('AWS configuration is incomplete. S3 operations will be mocked in development mode.');
}

// Initialize S3 client only if AWS is configured
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

// Constants
const MAX_THUMBNAIL_SIZE = 30 * 1024; // 30KB
const MAX_IMAGE_SIZE = 120 * 1024; // 120KB
const MAX_CUSTOMER_IMAGES = 10;
const MAX_POST_IMAGES = 20;

export type ImageType = "thumbnail" | "normal" | "gallery";
export type ResourceType = "customer" | "post";

interface UploadResult {
  url: string;
  key: string;
}

// Generate unique filename with timestamp and random string
const generateUniqueFilename = (originalFilename: string) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalFilename.split(".").pop();
  return `${timestamp}-${random}.${ext}`;
};

// Build S3 key with proper folder structure for customer
const buildS3Key = (customerId: string, filename: string, type: ImageType) => {
  const rootFolder = env.AWS_S3_ROOT_FOLDER;
  const folder = type === "thumbnail" ? "thumbnail" : "images";
  return `${rootFolder}/customer/${customerId}/${folder}/${filename}`;
};

// Build S3 key with proper folder structure for post
const buildPostS3Key = (postId: string, filename: string, type: ImageType) => {
  const rootFolder = env.AWS_S3_ROOT_FOLDER;
  const folder = type === "thumbnail" ? "thumbnail" : "gallery";
  return `${rootFolder}/post/${postId ?? "new"}/${folder}/${filename}`;
};

// Validate file size based on type
const validateFileSize = (size: number, type: ImageType) => {
  const maxSize = type === "thumbnail" ? MAX_THUMBNAIL_SIZE : MAX_IMAGE_SIZE;
  return size <= maxSize;
};

// Upload a single file to S3
export const uploadToS3 = async (
  file: Buffer,
  filename: string,
  id: string,
  type: ImageType,
  resourceType: ResourceType = "customer"
): Promise<UploadResult> => {
  if (!validateFileSize(file.length, type)) {
    throw new Error(
      `File size exceeds maximum allowed (${type === "thumbnail" ? "30KB" : "120KB"})`
    );
  }

  const uniqueFilename = generateUniqueFilename(filename);
  const key = resourceType === "customer" 
    ? buildS3Key(id, uniqueFilename, type)
    : buildPostS3Key(id, uniqueFilename, type);

  // If AWS is configured, upload to S3
  if (isAwsConfigured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET as string,
      Key: key,
      Body: file,
      ContentType: `image/${filename.split(".").pop()}`,
      ACL: 'public-read', // Make the file publicly accessible
    });

    await s3Client.send(command);

    const publicUrl = env.AWS_PUBLIC_URL || env.AWS_ENDPOINT;
    return {
      url: `${publicUrl}/${env.AWS_S3_BUCKET}/${key}`,
      key,
    };
  } else {
    // In development mode without AWS, return a mock URL
    console.log(`[DEV] Mock upload for ${resourceType} ${id}, type: ${type}, size: ${file.length} bytes`);
    return {
      url: `https://mock-s3.example.com/${key}`,
      key,
    };
  }
};

// Delete a file from S3
export const deleteFromS3 = async (key: string): Promise<void> => {
  // If AWS is configured, delete from S3
  if (isAwsConfigured && s3Client) {
    const command = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET as string,
      Key: key,
    });

    await s3Client.send(command);
  } else {
    // In development mode without AWS, just log the deletion
    console.log(`[DEV] Mock delete from S3: ${key}`);
  }
};

// Count existing images for a customer
export const countCustomerImages = async (customerId: string): Promise<number> => {
  // If AWS is not configured, return a mock count of 0
  if (!isAwsConfigured || !s3Client) {
    console.log(`[DEV] Mock count customer images for ${customerId}: 0`);
    return 0;
  }
  
  const rootFolder = env.AWS_S3_ROOT_FOLDER;
  const prefix = `${rootFolder}/customer/${customerId}/images/`;
  let count = 0;

  try {
    // List objects with the customer's images prefix
    const command = new ListObjectsV2Command({
      Bucket: env.AWS_S3_BUCKET as string,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    count = response.Contents?.length ?? 0;
  } catch (error) {
    console.error("Error counting customer images:", error);
    // In development, don't throw errors for S3 operations
    if (env.NODE_ENV === 'production') {
      throw error;
    } else {
      console.warn('[DEV] Error ignored in development mode');
      return 0;
    }
  }

  return count;
};

// Count existing images for a post
export const countPostImages = async (postId: string): Promise<number> => {
  // If AWS is not configured, return a mock count of 0
  if (!isAwsConfigured || !s3Client) {
    console.log(`[DEV] Mock count post images for ${postId}: 0`);
    return 0;
  }
  
  const rootFolder = env.AWS_S3_ROOT_FOLDER;
  const prefix = `${rootFolder}/post/${postId}/gallery/`;
  let count = 0;

  try {
    // List objects with the post's gallery prefix
    const command = new ListObjectsV2Command({
      Bucket: env.AWS_S3_BUCKET as string,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    count = response.Contents?.length ?? 0;
  } catch (error) {
    console.error("Error counting post images:", error);
    // In development, don't throw errors for S3 operations
    if (env.NODE_ENV === 'production') {
      throw error;
    } else {
      console.warn('[DEV] Error ignored in development mode');
      return 0;
    }
  }

  return count;
};

// Validate and upload multiple images
export const uploadMultipleImages = async (
  files: Array<{ buffer: Buffer; originalname: string }>,
  id: string,
  type: ImageType,
  resourceType: ResourceType = "customer"
): Promise<UploadResult[]> => {
  if (type === "normal" || type === "gallery") {
    let currentCount = 0;
    const maxImages = resourceType === "customer" ? MAX_CUSTOMER_IMAGES : MAX_POST_IMAGES;
    
    if (resourceType === "customer") {
      currentCount = await countCustomerImages(id);
    } else {
      currentCount = await countPostImages(id);
    }
    
    if (currentCount + files.length > maxImages) {
      throw new Error(`Maximum number of images (${maxImages}) would be exceeded`);
    }
  }

  // If AWS is not configured, log the upload operation in development mode
  if (!isAwsConfigured && env.NODE_ENV !== 'production') {
    console.log(`[DEV] Mock upload multiple images for ${resourceType} ${id}, count: ${files.length}`);
    
    // Return mock results
    return files.map((file, index) => {
      const uniqueFilename = generateUniqueFilename(file.originalname);
      const key = resourceType === "customer" 
        ? buildS3Key(id, uniqueFilename, type)
        : buildPostS3Key(id, uniqueFilename, type);
      
      return {
        url: `https://mock-s3.example.com/${key}?index=${index}`,
        key,
      };
    });
  }

  // Normal upload process when AWS is configured
  const uploadPromises = files.map((file) =>
    uploadToS3(file.buffer, file.originalname, id, type, resourceType)
  );

  return Promise.all(uploadPromises);
};
