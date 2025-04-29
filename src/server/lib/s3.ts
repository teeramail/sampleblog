import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { env } from "~/env";

// Initialize S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION ?? "sgp1",
  endpoint: env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

// Constants
const MAX_THUMBNAIL_SIZE = 30 * 1024; // 30KB
const MAX_IMAGE_SIZE = 120 * 1024; // 120KB
const MAX_IMAGES = 10;

export type ImageType = "thumbnail" | "normal";

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

// Build S3 key with proper folder structure
const buildS3Key = (customerId: string, filename: string, type: ImageType) => {
  const rootFolder = env.AWS_S3_ROOT_FOLDER;
  const folder = type === "thumbnail" ? "thumbnail" : "images";
  return `${rootFolder}/customer/${customerId}/${folder}/${filename}`;
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
  customerId: string,
  type: ImageType
): Promise<UploadResult> => {
  if (!validateFileSize(file.length, type)) {
    throw new Error(
      `File size exceeds maximum allowed (${type === "thumbnail" ? "30KB" : "120KB"})`
    );
  }

  const uniqueFilename = generateUniqueFilename(filename);
  const key = buildS3Key(customerId, uniqueFilename, type);

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: `image/${filename.split(".").pop()}`,
    ACL: 'public-read', // Make the file publicly accessible
  });

  await s3Client.send(command);

  return {
    url: `${env.AWS_ENDPOINT}/${env.AWS_S3_BUCKET}/${key}`,
    key,
  };
};

// Delete a file from S3
export const deleteFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};

// Count existing images for a customer
export const countCustomerImages = async (customerId: string): Promise<number> => {
  const rootFolder = env.AWS_S3_ROOT_FOLDER;
  const prefix = `${rootFolder}/customer/${customerId}/images/`;
  let count = 0;

  try {
    // List objects with the customer's images prefix
    const command = new ListObjectsV2Command({
      Bucket: env.AWS_S3_BUCKET,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    count = response.Contents?.length ?? 0;
  } catch (error) {
    console.error("Error counting customer images:", error);
    throw error;
  }

  return count;
};

// Validate and upload multiple images
export const uploadMultipleImages = async (
  files: Array<{ buffer: Buffer; originalname: string }>,
  customerId: string,
  type: ImageType
): Promise<UploadResult[]> => {
  if (type === "normal") {
    const currentCount = await countCustomerImages(customerId);
    if (currentCount + files.length > MAX_IMAGES) {
      throw new Error(`Maximum number of images (${MAX_IMAGES}) would be exceeded`);
    }
  }

  const uploadPromises = files.map((file) =>
    uploadToS3(file.buffer, file.originalname, customerId, type)
  );

  return Promise.all(uploadPromises);
};
