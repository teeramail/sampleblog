import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { topics, forumPosts } from "~/server/db/schema";
import { eq, desc, asc, and, lt, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";

// Schema for creating a new topic with initial post
const createTopicSchema = z.object({
  subject: z.string().min(3).max(256),
  content: z.string().min(3),
  thumbnailUrl: z.string().url(),
  imageUrls: z.array(z.string().url()).optional(),
  authorName: z.string().min(1).max(256),
});

// Schema for adding a post to an existing topic
const addPostSchema = z.object({
  topicId: z.string().uuid(),
  content: z.string().min(3),
  imageUrls: z.array(z.string().url()).optional(),
  authorName: z.string().min(1).max(256),
});

// Schema for pagination
const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().uuid().optional(),
  direction: z.enum(["forward", "backward"]).default("forward"),
});

export const topicRouter = createTRPCRouter({
  // Create a new topic with initial post
  create: publicProcedure
    .input(createTopicSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate a random UUID for authorId since we're not using authentication yet
        const authorId = uuidv4();
        
        // Create the topic
        const [topicResult] = await ctx.db.insert(topics).values({
          subject: input.subject,
          thumbnailUrl: input.thumbnailUrl,
          createdBy: authorId,
        }).returning();

        if (!topicResult) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create topic",
          });
        }

        // Create the initial post
        const [postResult] = await ctx.db.insert(forumPosts).values({
          topicId: topicResult.id,
          content: input.content,
          imageUrls: input.imageUrls || [],
          authorId: authorId,
          authorName: input.authorName,
        }).returning();

        return {
          topic: topicResult,
          initialPost: postResult,
        };
      } catch (error) {
        console.error("Error in topic.create:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create topic",
        });
      }
    }),

  // Add a post to an existing topic
  addPost: publicProcedure
    .input(addPostSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if topic exists
        const topic = await ctx.db.query.topics.findFirst({
          where: eq(topics.id, input.topicId),
        });

        if (!topic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Topic not found",
          });
        }

        // Generate a random UUID for authorId since we're not using authentication yet
        const authorId = uuidv4();

        // Create the post
        const [result] = await ctx.db.insert(forumPosts).values({
          topicId: input.topicId,
          content: input.content,
          imageUrls: input.imageUrls || [],
          authorId: authorId,
          authorName: input.authorName,
        }).returning();

        return result;
      } catch (error) {
        console.error("Error in topic.addPost:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add post to topic",
        });
      }
    }),

  // Get all topics with pagination
  getAll: publicProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      try {
        const { limit, cursor, direction } = input;
        
        let topicsQuery;
        
        if (direction === "forward") {
          if (cursor) {
            // Get topics after the cursor
            const cursorTopic = await ctx.db.query.topics.findFirst({
              where: eq(topics.id, cursor),
            });
            
            if (cursorTopic && cursorTopic.updatedAt) {
              topicsQuery = ctx.db.select()
                .from(topics)
                .where(lt(topics.updatedAt, cursorTopic.updatedAt))
                .orderBy(desc(topics.updatedAt))
                .limit(limit);
            } else {
              // Fallback if cursor topic not found
              topicsQuery = ctx.db.select()
                .from(topics)
                .orderBy(desc(topics.updatedAt))
                .limit(limit);
            }
          } else {
            // No cursor, get the first page
            topicsQuery = ctx.db.select()
              .from(topics)
              .orderBy(desc(topics.updatedAt))
              .limit(limit);
          }
        } else {
          // Backward pagination
          if (cursor) {
            // Get topics before the cursor
            const cursorTopic = await ctx.db.query.topics.findFirst({
              where: eq(topics.id, cursor),
            });
            
            if (cursorTopic && cursorTopic.updatedAt) {
              topicsQuery = ctx.db.select()
                .from(topics)
                .where(gt(topics.updatedAt, cursorTopic.updatedAt))
                .orderBy(asc(topics.updatedAt))
                .limit(limit);
            } else {
              // Fallback if cursor topic not found
              topicsQuery = ctx.db.select()
                .from(topics)
                .orderBy(desc(topics.updatedAt))
                .limit(limit);
            }
          } else {
            // No cursor for backward pagination doesn't make sense
            // Fallback to forward pagination
            topicsQuery = ctx.db.select()
              .from(topics)
              .orderBy(desc(topics.updatedAt))
              .limit(limit);
          }
        }
        
        const items = await topicsQuery;
        
        // Get post counts for each topic
        const topicIds = items.map(topic => topic.id);
        
        const postCounts = await Promise.all(
          topicIds.map(async (topicId) => {
            const count = await ctx.db
              .select({ count: ctx.db.fn.count() })
              .from(forumPosts)
              .where(eq(forumPosts.topicId, topicId));
            
            return {
              topicId,
              count: Number(count[0]?.count || 0),
            };
          })
        );
        
        // Get first post author for each topic
        const firstPosts = await Promise.all(
          topicIds.map(async (topicId) => {
            const post = await ctx.db.query.forumPosts.findFirst({
              where: eq(forumPosts.topicId, topicId),
              orderBy: asc(forumPosts.createdAt),
            });
            
            return {
              topicId,
              authorName: post?.authorName || "Unknown",
            };
          })
        );
        
        // Combine the data
        const topicsWithDetails = items.map(topic => {
          const postCount = postCounts.find(pc => pc.topicId === topic.id)?.count || 0;
          const firstPostAuthor = firstPosts.find(fp => fp.topicId === topic.id)?.authorName || "Unknown";
          
          return {
            ...topic,
            postCount,
            firstPostAuthor,
          };
        });
        
        return {
          items: topicsWithDetails,
          nextCursor: items.length === limit ? items[items.length - 1]?.id : undefined,
        };
      } catch (error) {
        console.error("Error in topic.getAll:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch topics",
        });
      }
    }),

  // Get a topic by ID with all its posts
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        // Get the topic
        const topic = await ctx.db.query.topics.findFirst({
          where: eq(topics.id, input.id),
        });

        if (!topic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Topic not found",
          });
        }

        // Get all posts for this topic
        const posts = await ctx.db.query.forumPosts.findMany({
          where: eq(forumPosts.topicId, input.id),
          orderBy: asc(forumPosts.createdAt),
        });

        return {
          topic,
          posts,
        };
      } catch (error) {
        console.error("Error in topic.getById:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch topic",
        });
      }
    }),
});
