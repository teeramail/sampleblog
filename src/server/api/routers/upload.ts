import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { deleteFromS3 } from "~/server/lib/s3";

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
