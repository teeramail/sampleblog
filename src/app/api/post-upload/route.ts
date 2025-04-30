import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { uploadToS3 } from "~/server/lib/s3";
import type { ImageType, ResourceType } from "~/server/lib/s3";

// Constants for file size limits
const MAX_THUMBNAIL_SIZE = 30 * 1024; // 30KB
const MAX_IMAGE_SIZE = 120 * 1024; // 120KB
const MAX_POST_IMAGES = 10; // Maximum 10 images per post

export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    
    // Get the file from the form data
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }
    
    // Get the post ID and image type
    const postId = formData.get("postId") as string;
    const type = formData.get("type") as ImageType;
    
    if (!postId) {
      return NextResponse.json(
        { success: false, message: "Post ID is required" },
        { status: 400 }
      );
    }
    
    if (!type || (type !== "thumbnail" && type !== "gallery")) {
      return NextResponse.json(
        { success: false, message: "Valid image type (thumbnail or gallery) is required" },
        { status: 400 }
      );
    }
    
    // Validate file size based on type
    const maxSize = type === "thumbnail" ? MAX_THUMBNAIL_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          message: `File size exceeds maximum allowed (${maxSize / 1024}KB)` 
        },
        { status: 400 }
      );
    }
    
    // Convert the file to a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload the file to S3 using the post resourceType
    const result = await uploadToS3(buffer, file.name, postId, type, "post");
    
    // Return the URL and key
    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to upload file" 
      },
      { status: 500 }
    );
  }
} 