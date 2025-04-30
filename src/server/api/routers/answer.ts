import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { answers, posts } from "~/server/db/schema";
import { 
  MAX_IMAGES_PER_POST,
  filterValidImageUrls,
  validateImageAdditionOrThrow
} from "~/server/api/utils/imageValidation";

// Input validation schema for creating an answer
const answerInputSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1, "Content is required"),
  imageUrls: z.array(z.string()).optional(),
  authorName: z.string().optional(),
  isVerified: z.boolean().default(false),
});

// Input validation schema for updating an answer
const answerUpdateSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1, "Content is required").optional(),
  imageUrls: z.array(z.string()).optional(),
  authorName: z.string().optional(),
  isVerified: z.boolean().optional(),
});

export const answerRouter = createTRPCRouter({
  // Create a new answer
  create: publicProcedure
    .input(answerInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if the post exists
        const post = await ctx.db.query.posts.findFirst({
          where: eq(posts.id, input.postId),
        });
        
        if (!post) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post/question not found",
          });
        }
        
        // Insert the answer
        const result = await ctx.db.insert(answers).values({
          postId: input.postId,
          content: input.content,
          imageUrls: filterValidImageUrls(input.imageUrls).length > 0
            ? filterValidImageUrls(input.imageUrls)
            : null,
          authorName: input.authorName || null,
          isVerified: input.isVerified,
        }).returning();

        return result[0];
      } catch (error) {
        console.error("Error in answer.create:", error);
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create answer",
          cause: error,
        });
      }
    }),

  // Get all answers for a post
  getByPostId: publicProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        // Get all answers for the post, ordered by creation date
        const answersList = await ctx.db.select()
          .from(answers)
          .where(eq(answers.postId, input.postId))
          .orderBy(desc(answers.createdAt));
        
        // Normalize null imageUrls to empty arrays
        return answersList.map((answer) => ({
          ...answer,
          imageUrls: answer.imageUrls ?? []
        }));
      } catch (error) {
        console.error("Error in answer.getByPostId:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch answers",
          cause: error,
        });
      }
    }),

  // Get a specific answer by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const answer = await ctx.db.query.answers.findFirst({
          where: eq(answers.id, input.id),
        });

        if (!answer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Answer not found",
          });
        }

        // Normalize null imageUrls to empty array
        return {
          ...answer,
          imageUrls: answer.imageUrls ?? []
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch answer",
          cause: error,
        });
      }
    }),

  // Update an answer
  update: publicProcedure
    .input(answerUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;
        
        // Check if answer exists
        const existingAnswer = await ctx.db.query.answers.findFirst({
          where: eq(answers.id, id),
        });
        
        if (!existingAnswer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Answer not found",
          });
        }
        
        // Process image URLs if provided
        let processedData = { ...updateData };
        if (updateData.imageUrls !== undefined) {
          const filteredImageUrls = filterValidImageUrls(updateData.imageUrls);
          processedData.imageUrls = filteredImageUrls.length > 0 
            ? filteredImageUrls 
            : undefined;
        }
        
        // Update the answer
        const result = await ctx.db.update(answers)
          .set({
            ...processedData,
            updatedAt: new Date(),
          })
          .where(eq(answers.id, id))
          .returning();
          
        return result[0];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("Error in answer.update:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update answer",
          cause: error,
        });
      }
    }),

  // Delete an answer
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if answer exists
        const existingAnswer = await ctx.db.query.answers.findFirst({
          where: eq(answers.id, input.id),
        });
        
        if (!existingAnswer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Answer not found",
          });
        }
        
        // Delete the answer
        const result = await ctx.db.delete(answers)
          .where(eq(answers.id, input.id))
          .returning();
          
        return result[0];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("Error in answer.delete:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete answer",
          cause: error,
        });
      }
    }),
}); 