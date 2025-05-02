import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { eq, like, or, desc, lt, and, asc } from "drizzle-orm";
import { posts, contentSections, sectionImages } from "~/server/db/schema";
import { v4 as uuidv4 } from "uuid";
import { deleteFromS3 } from "~/server/lib/s3";
import { 
  MAX_IMAGES_PER_POST,
  filterValidImageUrls,
  validateImageAdditionOrThrow
} from "~/server/api/utils/imageValidation";

// Input validation schemas
const postInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  customer_id: z.string().uuid("Valid customer ID is required"),
});

const postUpdateSchema = postInputSchema.partial().extend({
  id: z.string().uuid(),
});

// Schema for follow-up questions
const followUpQuestionSchema = z.object({
  relatedPostId: z.string().uuid(),
  content: z.string().min(1, "Question content is required"),
});

// New schema for appending content to existing posts
const appendContentSchema = z.object({
  id: z.string().uuid(),
  newContent: z.string().min(1, "New content is required"),
  newImageUrls: z.array(z.string()).optional(),
});

// Schema for content sections
const contentSectionSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1, "Content is required"),
  imageUrls: z.array(z.string()).optional(),
});

// Schema for getting content sections
const getContentSectionsSchema = z.object({
  postId: z.string().uuid(),
});

// Special marker to identify content sections with associated images
const CONTENT_SECTION_MARKER = '<!-- CONTENT_SECTION -->';
const IMAGE_SECTION_MARKER = '<!-- IMAGE_SECTION -->';

// Function to format appended content with timestamp and image markers
const formatAppendedContent = (originalContent: string, newContent: string, newImageUrls?: string[]): string => {
  const timestamp = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Create a new content section with markers for images
  let formattedNewContent = `${CONTENT_SECTION_MARKER}\n${newContent}`;
  
  // Add image section marker and JSON-encoded image URLs if there are any
  if (newImageUrls && newImageUrls.length > 0) {
    formattedNewContent += `\n\n${IMAGE_SECTION_MARKER}\n${JSON.stringify(newImageUrls)}`;
  }
  
  // Add timestamp separator
  formattedNewContent += `\n\n--- Added on ${timestamp} ---\n\n`;
  
  // Prepend new content to original content (chronological order - newest first)
  return formattedNewContent + originalContent;
};

export const postRouter = createTRPCRouter({
  // Create a new post
  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        author_name: z.string().optional(),
        is_active: z.boolean().default(true),
        is_question: z.boolean().default(true),
        image_urls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Process images if provided
        let processedImageUrls: string[] = [];
        
        if (input.image_urls && input.image_urls.length > 0) {
          // In a real implementation, we would process the images here
          // For example, upload them to S3 and get the URLs
          // For now, we'll just use the provided URLs
          processedImageUrls = input.image_urls;
          
          // Limit the number of images to 10
          if (processedImageUrls.length > 10) {
            processedImageUrls = processedImageUrls.slice(0, 10);
          }
        }
        
        const post = await ctx.db.insert(posts).values({
          id: uuidv4(),
          title: input.title,
          content: input.content,
          author_name: input.author_name,
          is_active: input.is_active,
          is_question: input.is_question,
          created_at: new Date(),
          updated_at: new Date(),
          image_urls: processedImageUrls, // Use processed image URLs
        }).returning();

        return post[0];
      } catch (error) {
        console.error("Error in post.create:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post",
          cause: error,
        });
      }
    }),

  // Add follow-up question
  addFollowUpQuestion: publicProcedure
    .input(followUpQuestionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the original post to use its title
        const originalPost = await ctx.db.query.posts.findFirst({
          where: eq(posts.id, input.relatedPostId),
        });
        
        if (!originalPost) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Original post not found",
          });
        }
        
        // Create a follow-up question with same title but "[Follow-up]" prefix
        const title = `[Follow-up] ${originalPost.title}`;
        
        const result = await ctx.db.insert(posts).values({
          title,
          content: input.content,
          is_active: true,
          is_question: true,
          created_at: new Date(),
          updated_at: new Date(),
          author_name: originalPost.author_name || 'System', // Reuse author name or default
        }).returning();

        return result[0];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("Error in post.addFollowUpQuestion:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create follow-up question",
          cause: error,
        });
      }
    }),

  // Get all posts ordered by created_at desc
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
            
            if (cursorPost) {
              // Use the reference post updated_at for pagination
              // Handle case where updated_at might be null
              if (cursorPost.updated_at) {
                items = await ctx.db.select()
                  .from(posts)
                  .orderBy(desc(posts.updated_at)) // Order by updated_at descending
                  .where(lt(posts.updated_at, cursorPost.updated_at)) // Get posts with updated_at less than cursor
                  .limit(limit);
              } else {
                // Fallback to ordering by ID if updated_at is null
                items = await ctx.db.select()
                  .from(posts)
                  .orderBy(desc(posts.updated_at)) // Still order by updated_at
                  .limit(limit);
              }
            } else {
              // Fallback if cursor post not found
              items = await ctx.db.select()
                .from(posts)
                .orderBy(desc(posts.updated_at)) // Order by updated_at descending
                .limit(limit);
            }
          } catch (err) {
            console.error("Error in cursor pagination:", err);
            // Fallback to non-cursor query
            items = await ctx.db.select()
              .from(posts)
              .orderBy(desc(posts.updated_at)) // Order by updated_at descending
              .limit(limit);
          }
        } else {
          // No cursor, just get the first page
          items = await ctx.db.select()
            .from(posts)
            .orderBy(desc(posts.updated_at)) // Order by updated_at descending
            .limit(limit);
        }
        
        // No need to normalize fields that don't exist in the schema
        
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
          .where(like(posts.title, searchPattern))
          .orderBy(desc(posts.updated_at)) // Order by updated_at descending for consistency with getAll
          .limit(input.limit);
        
        const items = results;
        
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

        return post;
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
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      author_name: z.string().optional(),
      is_active: z.boolean().optional(),
      is_question: z.boolean().optional(),
      image_urls: z.array(z.string()).optional(),
    }))
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
        
        // Process images if provided
        let processedImageUrls = updateData.image_urls;
        
        // Update the post with the form data and processed images
        const result = await ctx.db.update(posts)
          .set({
            ...updateData,
            updated_at: new Date(), // Always update the updated_at timestamp
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

  // New procedure: Append content to an existing post
  appendContent: publicProcedure
    .input(appendContentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, newContent, newImageUrls } = input;
        
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
        
        // Process new images if provided
        let processedNewImageUrls: string[] = [];
        if (newImageUrls && newImageUrls.length > 0) {
          // Ensure we're working with arrays
          processedNewImageUrls = Array.isArray(newImageUrls) ? newImageUrls : [newImageUrls];
          
          console.log('Processing new images for content:', {
            newImages: processedNewImageUrls.length
          });
        }
        
        // Format the appended content with a timestamp and include image references
        const originalContent = existingPost.content;
        const formattedContent = formatAppendedContent(originalContent, newContent, processedNewImageUrls);
        
        // Prepare update data
        const updateData: Record<string, any> = {
          content: formattedContent,
          updated_at: new Date()
        };
        
        // Store all images in the post's image_urls array for backward compatibility
        if (processedNewImageUrls.length > 0) {
          // Combine existing images with new ones
          const existingImages = existingPost.image_urls || [];
          const existingImagesArray = Array.isArray(existingImages) ? existingImages : [];
          
          // Combine and set the image URLs
          updateData.image_urls = [...existingImagesArray, ...processedNewImageUrls];
          
          console.log('Adding images to post image_urls array:', {
            existingImages: existingImagesArray.length,
            newImages: processedNewImageUrls.length,
            combined: updateData.image_urls.length
          });
        }
        
        // Update the post
        const result = await ctx.db.update(posts)
          .set(updateData)
          .where(eq(posts.id, id))
          .returning();
          
        return result[0];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("Error in post.appendContent:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to append content to post",
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

  // New procedure: Append content to an existing post
  // Removed duplicate appendContent procedure
    
  // Add a new procedure to get content sections with their images
  getContentSections: publicProcedure
    .input(getContentSectionsSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Get all content sections for this post ordered by order_index (oldest first)
        const sections = await ctx.db.query.contentSections.findMany({
          where: eq(contentSections.post_id, input.postId),
          orderBy: asc(contentSections.order_index),
          with: {
            images: {
              orderBy: asc(sectionImages.order_index),
            },
          },
        });

        // Transform the data for the frontend
        return sections.map(section => ({
          id: section.id,
          content: section.content,
          createdAt: section.created_at,
          imageUrls: section.images.map(img => img.image_url),
        }));
      } catch (error) {
        console.error("Error getting content sections:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get content sections",
          cause: error,
        });
      }
    }),
    
  // Add a new procedure to add a content section
  addContentSection: publicProcedure
    .input(contentSectionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Begin a transaction
        return await ctx.db.transaction(async (tx) => {
          // 1. Count existing content sections to determine order_index
          const existingSections = await tx.query.contentSections.findMany({
            where: eq(contentSections.post_id, input.postId),
          });
          
          const orderIndex = existingSections.length;

          // 2. Insert new content section
          const insertResult = await tx
            .insert(contentSections)
            .values({
              post_id: input.postId,
              content: input.content,
              order_index: orderIndex,
            })
            .returning();
            
          // Make sure we have a valid section
          if (!insertResult || insertResult.length === 0) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create content section",
            });
          }
          
          const newSection = insertResult[0];

          // 3. Insert images for this section if any
          if (input.imageUrls && input.imageUrls.length > 0) {
            const imageValues = input.imageUrls.map((url, index) => ({
              section_id: newSection.id,
              image_url: url,
              order_index: index,
            }));

            await tx.insert(sectionImages).values(imageValues);
          }

          // 4. Also update the post's image_urls array for backward compatibility
          const post = await tx.query.posts.findFirst({
            where: eq(posts.id, input.postId),
          });

          if (post && input.imageUrls && input.imageUrls.length > 0) {
            const existingImages = post.image_urls || [];
            await tx
              .update(posts)
              .set({
                image_urls: [...existingImages, ...input.imageUrls],
                updated_at: new Date(),
              })
              .where(eq(posts.id, input.postId));
          }

          return { 
            success: true, 
            sectionId: newSection.id 
          };
        });
      } catch (error) {
        console.error("Error adding content section:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add content section",
          cause: error,
        });
      }
    }),
});