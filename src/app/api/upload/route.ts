import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { uploadToS3 } from "~/server/lib/s3";
import type { ImageType } from "~/server/lib/s3";

// Constants for file size limits
const MAX_THUMBNAIL_SIZE = 30 * 1024; // 30KB
const MAX_IMAGE_SIZE = 120 * 1024; // 120KB

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
    
    // Get the customer ID and image type
    const customerId = formData.get("customerId") as string;
    const type = formData.get("type") as ImageType;
    
    if (!customerId) {
      return NextResponse.json(
        { success: false, message: "Customer ID is required" },
        { status: 400 }
      );
    }
    
    if (!type || (type !== "thumbnail" && type !== "normal")) {
      return NextResponse.json(
        { success: false, message: "Valid image type (thumbnail or normal) is required" },
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
    
    // Upload the file to S3
    const result = await uploadToS3(buffer, file.name, customerId, type);
    
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
