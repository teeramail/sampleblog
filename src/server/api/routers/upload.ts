import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { deleteFromS3 } from "~/server/lib/s3";
import { processBase64Image, processBase64Images } from "~/server/lib/image-processor";
import { v4 as uuidv4 } from "uuid";

export const uploadRouter = createTRPCRouter({
  // Get pre-signed URL for client-side upload
  getPresignedUrl: publicProcedure
    .input(
      z.object({
        customerId: z.string(),
        filename: z.string(),
        type: z.enum(["thumbnail", "normal"]),
      })
    )
    .mutation(async ({ input: _ }) => {
      try {
        // Implementation will be added when needed for client-side uploads
        throw new Error("Not implemented");
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate pre-signed URL",
          cause: error,
        });
      }
    }),

  // Get pre-signed URL for post uploads
  getPostPresignedUrl: publicProcedure
    .input(
      z.object({
        postId: z.string().optional(), // Optional for new posts
        filename: z.string(),
        type: z.enum(["thumbnail", "gallery"]),
      })
    )
    .mutation(async ({ input: _ }) => {
      try {
        // Implementation will be added when needed for client-side uploads
        throw new Error("Not implemented");
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate pre-signed URL for post",
          cause: error,
        });
      }
    }),
  
  // Process and upload a forum topic thumbnail (server-side)
  uploadTopicThumbnail: publicProcedure
    .input(
      z.object({
        base64Image: z.string().refine(
          (val) => val.startsWith('data:image/'),
          { message: "Must be a base64 encoded image" }
        ),
        topicId: z.string().uuid().optional(), // Optional for new topics
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Generate a temporary topic ID if not provided
        const topicId = input.topicId || uuidv4();
        
        // Process and upload the thumbnail
        const thumbnailUrl = await processBase64Image(
          input.base64Image,
          true, // is thumbnail
          topicId
        );
        
        return { thumbnailUrl, topicId };
      } catch (error) {
        console.error("Error uploading topic thumbnail:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload topic thumbnail",
          cause: error,
        });
      }
    }),
    
  // Process and upload forum post images (server-side)
  uploadForumImages: publicProcedure
    .input(
      z.object({
        base64Images: z.array(
          z.string().refine(
            (val) => val.startsWith('data:image/'),
            { message: "Must be a base64 encoded image" }
          )
        ),
        topicId: z.string().uuid(),
        postId: z.string().uuid().optional(), // Optional for new posts
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Generate a temporary post ID if not provided
        const postId = input.postId || uuidv4();
        
        // Process and upload the images
        const imageUrls = await processBase64Images(
          input.base64Images,
          input.topicId,
          postId
        );
        
        return { imageUrls, postId };
      } catch (error) {
        console.error("Error uploading forum images:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload forum images",
          cause: error,
        });
      }
    }),

  // Delete file from S3
  deleteFile: publicProcedure
    .input(
      z.object({
        key: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await deleteFromS3(input.key);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete file",
          cause: error,
        });
      }
    }),
});
