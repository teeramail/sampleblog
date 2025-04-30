import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { eq, like, or, desc, lt } from "drizzle-orm";
import { posts } from "~/server/db/schema";
import { deleteFromS3 } from "~/server/lib/s3";

// Input validation schemas
const postInputSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  thumbnailUrl: z.string().min(1, "Thumbnail is required"),
  imageUrls: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

const postUpdateSchema = postInputSchema.partial().extend({
  id: z.string().uuid(),
});

export const postRouter = createTRPCRouter({
  // Create a new post
  create: publicProcedure
    .input(postInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.insert(posts).values({
          subject: input.subject,
          content: input.content,
          thumbnailUrl: input.thumbnailUrl,
          imageUrls: input.imageUrls?.filter((s) => typeof s === "string" && s.length > 0) ?? null,
          isActive: input.isActive,
        }).returning();

        return result[0];
      } catch (error) {
        console.error("Error in post.create:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post",
          cause: error,
        });
      }
    }),

  // Get all posts ordered by createdAt desc
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().uuid().optional(), // for pagination
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input?.limit ?? 10;
        const cursor = input?.cursor ?? undefined;
        let items = [];
        
        // Handle pagination with cursor
        if (cursor) {
          try {
            // First get the reference post for pagination
            const cursorPost = await ctx.db.query.posts.findFirst({
              where: eq(posts.id, cursor),
            });
            
            if (cursorPost && cursorPost.createdAt) {
              // Use the reference timestamp for cursor-based pagination
              items = await ctx.db.select()
                .from(posts)
                .where(lt(posts.createdAt, cursorPost.createdAt))
                .orderBy(desc(posts.createdAt))
                .limit(limit);
            } else {
              // Fallback if cursor post not found
              items = await ctx.db.select()
                .from(posts)
                .orderBy(desc(posts.createdAt))
                .limit(limit);
            }
          } catch (err) {
            console.error("Error in cursor pagination:", err);
            // Fallback to non-cursor query
            items = await ctx.db.select()
              .from(posts)
              .orderBy(desc(posts.createdAt))
              .limit(limit);
          }
        } else {
          // No cursor, just get the first page
          items = await ctx.db.select()
            .from(posts)
            .orderBy(desc(posts.createdAt))
            .limit(limit);
        }
        
        // Normalize null imageUrls to empty arrays for the client
        items = items.map((item) => ({
          ...item,
          imageUrls: item.imageUrls ?? []
        }));
        
        // Set up the next cursor for pagination
        let nextCursor: typeof cursor | undefined = undefined;
        if (items.length > 0) {
          const lastItem = items[items.length - 1];
          nextCursor = lastItem?.id;
        }
        
        return {
          items,
          nextCursor,
        };
      } catch (error) {
        console.error("Error in post.getAll:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch posts",
          cause: error,
        });
      }
    }),

  // Search posts by subject
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const searchPattern = `%${input.query}%`;
        
        const results = await ctx.db.select()
          .from(posts)
          .where(like(posts.subject, searchPattern))
          .orderBy(desc(posts.createdAt))
          .limit(input.limit);
        
        // Normalize null imageUrls to empty arrays
        const items = results.map((item) => ({
          ...item,
          imageUrls: item.imageUrls ?? []
        }));
        
        return items;
      } catch (error) {
        console.error("Error in post.search:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search posts",
          cause: error,
        });
      }
    }),

  // Get post by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const post = await ctx.db.query.posts.findFirst({
          where: eq(posts.id, input.id),
        });

        if (!post) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }

        // Normalize null imageUrls to empty array
        return {
          ...post,
          imageUrls: post.imageUrls ?? []
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch post",
          cause: error,
        });
      }
    }),

  // Update post
  update: publicProcedure
    .input(postUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;
        
        // Check if post exists
        const existingPost = await ctx.db.query.posts.findFirst({
          where: eq(posts.id, id),
        });
        
        if (!existingPost) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }
        
        const result = await ctx.db.update(posts)
          .set({
            ...updateData,
            // Use null for empty imageUrls arrays, and filter out empty strings
            imageUrls: updateData.imageUrls?.filter((s) => typeof s === "string" && s.length > 0).length
              ? updateData.imageUrls.filter((s) => typeof s === "string" && s.length > 0)
              : null,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, id))
          .returning();
          
        return result[0];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("Error in post.update:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update post",
          cause: error,
        });
      }
    }),

  // Delete post
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if post exists and get its data
        const existingPost = await ctx.db.query.posts.findFirst({
          where: eq(posts.id, input.id),
        });
        
        if (!existingPost) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }
        
        // Delete associated images from S3
        try {
          if (existingPost.thumbnailUrl) {
            await deleteFromS3(existingPost.thumbnailUrl);
          }
          
          if (existingPost.imageUrls && existingPost.imageUrls.length > 0) {
            await Promise.all(
              existingPost.imageUrls.map(url => deleteFromS3(url))
            );
          }
        } catch (s3Error) {
          // Log error but continue with deletion
          console.error("Error deleting S3 objects:", s3Error);
        }
        
        // Delete the post from the database
        const result = await ctx.db.delete(posts)
          .where(eq(posts.id, input.id))
          .returning();
          
        return result[0];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("Error in post.delete:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete post",
          cause: error,
        });
      }
    }),

  // Get unique subjects for dropdown selection
  getSubjects: publicProcedure
    .query(async ({ ctx }) => {
      try {
        // Get distinct subjects from posts
        const result = await ctx.db.selectDistinct({ subject: posts.subject })
          .from(posts)
          .orderBy(posts.subject);
        
        return result.map(item => item.subject);
      } catch (error) {
        console.error("Error in post.getSubjects:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch post subjects",
          cause: error,
        });
      }
    }),
}); 