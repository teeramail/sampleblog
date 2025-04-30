import { TRPCError } from "@trpc/server";

// Maximum number of images allowed per post
export const MAX_IMAGES_PER_POST = 10;

// Maximum size for thumbnail images (in KB)
export const MAX_THUMBNAIL_SIZE_KB = 30;

// Maximum size for regular images (in KB)
export const MAX_IMAGE_SIZE_KB = 120;

/**
 * Count the number of markdown and HTML images in a content string
 * @param content - The content string to analyze
 * @returns The number of images found in the content
 */
export const countImagesInContent = (content: string): number => {
  if (!content) return 0;
  
  // Use regex to count markdown image syntax ![alt](url)
  const markdownImageRegex = /!\[.*?\]\(.*?\)/g;
  const markdownMatches = content.match(markdownImageRegex) || [];
  
  // Also count HTML img tags for completeness
  const htmlImageRegex = /<img.*?src=["'].*?["'].*?>/g;
  const htmlMatches = content.match(htmlImageRegex) || [];
  
  return markdownMatches.length + htmlMatches.length;
};

/**
 * Filter an array of image URLs to remove empty strings and invalid URLs
 * @param imageUrls - Array of image URLs to filter
 * @returns Filtered array of valid image URLs
 */
export const filterValidImageUrls = (imageUrls?: string[] | null): string[] => {
  if (!imageUrls) return [];
  
  return imageUrls.filter(url => typeof url === "string" && url.trim().length > 0);
};

/**
 * Calculate the remaining image capacity for a post
 * @param existingImageUrls - Array of existing image URLs in the post
 * @param contentImageCount - Number of images in the content (optional)
 * @returns The number of additional images that can be added
 */
export const calculateRemainingImageCapacity = (
  existingImageUrls: string[] | null = null,
  contentImageCount = 0
): number => {
  const filteredUrls = filterValidImageUrls(existingImageUrls);
  const remainingCapacity = MAX_IMAGES_PER_POST - filteredUrls.length - contentImageCount;
  return Math.max(0, remainingCapacity);
};

/**
 * Validate if adding new images to a post would exceed limits
 * @param existingImageUrls - Array of existing image URLs in the post
 * @param newImageUrls - Array of new image URLs to add
 * @param newContent - New content text that might contain embedded images (optional)
 * @returns Object containing validation result, remaining capacity, and error message if invalid
 */
export const validateImageAddition = (
  existingImageUrls: string[] | null = null,
  newImageUrls: string[] | null = null,
  newContent?: string
): { valid: boolean; remainingCapacity: number; message?: string } => {
  const filteredExistingUrls = filterValidImageUrls(existingImageUrls);
  const filteredNewUrls = filterValidImageUrls(newImageUrls);
  const contentImageCount = newContent ? countImagesInContent(newContent) : 0;
  
  const totalImageCount = filteredExistingUrls.length + filteredNewUrls.length + contentImageCount;
  const remainingCapacity = MAX_IMAGES_PER_POST - totalImageCount;
  
  if (totalImageCount > MAX_IMAGES_PER_POST) {
    return {
      valid: false,
      remainingCapacity: 0,
      message: `Maximum number of images (${MAX_IMAGES_PER_POST}) exceeded. You can add ${calculateRemainingImageCapacity(filteredExistingUrls)} more images to this post.`
    };
  }
  
  return { 
    valid: true, 
    remainingCapacity: Math.max(0, remainingCapacity) 
  };
};

/**
 * Throws a TRPC error if adding new images would exceed limits
 * @param existingImageUrls - Array of existing image URLs in the post
 * @param newImageUrls - Array of new image URLs to add
 * @param newContent - New content text that might contain embedded images (optional)
 * @throws TRPCError with BAD_REQUEST code if limits would be exceeded
 */
export const validateImageAdditionOrThrow = (
  existingImageUrls: string[] | null = null,
  newImageUrls: string[] | null = null,
  newContent?: string
): void => {
  const result = validateImageAddition(existingImageUrls, newImageUrls, newContent);
  
  if (!result.valid) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: result.message || `Maximum number of images (${MAX_IMAGES_PER_POST}) exceeded.`
    });
  }
};

/**
 * Validate a file size against a maximum size limit
 * @param fileSizeInBytes - The file size in bytes
 * @param maxSizeInKB - The maximum allowed size in kilobytes
 * @returns True if the file size is valid, false otherwise
 */
export const validateFileSize = (
  fileSizeInBytes: number, 
  maxSizeInKB: number
): boolean => {
  const fileSizeInKB = fileSizeInBytes / 1024;
  return fileSizeInKB <= maxSizeInKB;
};

/**
 * Get friendly size display for error messages
 * @param sizeInKB - Size in kilobytes
 * @returns Formatted size string (e.g., "120 KB")
 */
export const formatFileSize = (sizeInKB: number): string => {
  if (sizeInKB >= 1024) {
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  }
  return `${sizeInKB} KB`;
};

/**
 * Validate a thumbnail file size
 * @param fileSizeInBytes - The file size in bytes
 * @returns Object with validation result and error message if invalid
 */
export const validateThumbnailSize = (
  fileSizeInBytes: number
): { valid: boolean; message?: string } => {
  const isValid = validateFileSize(fileSizeInBytes, MAX_THUMBNAIL_SIZE_KB);
  
  if (!isValid) {
    return {
      valid: false,
      message: `Thumbnail image exceeds maximum size of ${formatFileSize(MAX_THUMBNAIL_SIZE_KB)}.`
    };
  }
  
  return { valid: true };
};

/**
 * Validate a regular image file size
 * @param fileSizeInBytes - The file size in bytes
 * @returns Object with validation result and error message if invalid
 */
export const validateImageSize = (
  fileSizeInBytes: number
): { valid: boolean; message?: string } => {
  const isValid = validateFileSize(fileSizeInBytes, MAX_IMAGE_SIZE_KB);
  
  if (!isValid) {
    return {
      valid: false,
      message: `Image exceeds maximum size of ${formatFileSize(MAX_IMAGE_SIZE_KB)}.`
    };
  }
  
  return { valid: true };
}; 