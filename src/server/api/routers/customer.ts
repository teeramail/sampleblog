import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { eq, like, or, desc, lt } from "drizzle-orm";
import { customers } from "~/server/db/schema";
import { deleteFromS3 } from "~/server/lib/s3";

// Input validation schemas
const customerInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
});

const customerUpdateSchema = customerInputSchema.partial().extend({
  id: z.string().uuid(),
});

export const customerRouter = createTRPCRouter({
  // Create a new customer
  create: publicProcedure
    .input(customerInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.insert(customers).values({
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          thumbnailUrl: input.thumbnailUrl ?? null,
          imageUrls: input.imageUrls?.filter((s) => typeof s === "string" && s.length > 0) ?? null,
        }).returning();

        return result[0];
      } catch (error) {
        console.error("Error in customer.create:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create customer",
          cause: error,
        });
      }
    }),

  // Get all customers ordered by updatedAt desc
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
            // First get the reference customer for pagination
            const cursorCustomer = await ctx.db.query.customers.findFirst({
              where: eq(customers.id, cursor),
            });
            
            if (cursorCustomer && cursorCustomer.updatedAt) {
              // Use the reference timestamp for cursor-based pagination
              items = await ctx.db.select()
                .from(customers)
                .where(lt(customers.updatedAt, cursorCustomer.updatedAt))
                .orderBy(desc(customers.updatedAt))
                .limit(limit);
            } else {
              // Fallback if cursor customer not found
              items = await ctx.db.select()
                .from(customers)
                .orderBy(desc(customers.updatedAt))
                .limit(limit);
            }
          } catch (err) {
            console.error("Error in cursor pagination:", err);
            // Fallback to non-cursor query
            items = await ctx.db.select()
              .from(customers)
              .orderBy(desc(customers.updatedAt))
              .limit(limit);
          }
        } else {
          // No cursor, just get the first page
          items = await ctx.db.select()
            .from(customers)
            .orderBy(desc(customers.updatedAt))
            .limit(limit);
        }
        
        // Normalize null imageUrls to empty arrays for the client
        items = items.map((item: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          thumbnailUrl: string | null;
          imageUrls: string[] | null;
          createdAt: Date;
          updatedAt: Date;
        }) => ({
          ...item,
          imageUrls: item.imageUrls || []
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
        console.error("Error in customer.getAll:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch customers",
          cause: error,
        });
      }
    }),

  // Get customer by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const customer = await ctx.db.query.customers.findFirst({
          where: eq(customers.id, input.id),
        });

        if (!customer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer not found",
          });
        }

        return customer;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch customer",
          cause: error,
        });
      }
    }),

  // Update customer
  update: publicProcedure
    .input(customerUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;
        
        // Check if customer exists
        const existingCustomer = await ctx.db.query.customers.findFirst({
          where: eq(customers.id, id),
        });
        
        if (!existingCustomer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer not found",
          });
        }
        
        const result = await ctx.db.update(customers)
          .set({
            ...updateData,
            // Use null for empty imageUrls arrays, and filter out empty strings
            imageUrls: updateData.imageUrls?.filter((s) => typeof s === "string" && s.length > 0).length
              ? updateData.imageUrls.filter((s) => typeof s === "string" && s.length > 0)
              : null,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, id))
          .returning();
          
        return result[0];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update customer",
          cause: error,
        });
      }
    }),

  // Delete customer
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get customer to access image URLs
        const customer = await ctx.db.query.customers.findFirst({
          where: eq(customers.id, input.id),
        });
        
        if (!customer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer not found",
          });
        }
        
        // Delete the customer from the database
        await ctx.db.delete(customers).where(eq(customers.id, input.id));
        
        // Delete images from S3
        const deletePromises: Promise<void>[] = [];
        
        // Extract S3 keys from URLs
        const extractKeyFromUrl = (url: string) => {
          const parts = url.split('/');
          if (parts.length < 4) return url;
          
          const bucketName = parts[3];
          if (!bucketName) return url;
          
          const bucketIndex = url.indexOf(bucketName);
          if (bucketIndex === -1) return url;
          
          return url.substring(bucketIndex + bucketName.length + 1);
        };
        
        // Delete thumbnail if exists
        if (customer?.thumbnailUrl) {
          const thumbnailKey = extractKeyFromUrl(customer.thumbnailUrl);
          if (thumbnailKey && thumbnailKey !== customer.thumbnailUrl) {
            deletePromises.push(deleteFromS3(thumbnailKey));
          }
        }
        
        // Delete old images if they exist
        if (customer?.imageUrls && customer.imageUrls.length > 0) {
          await Promise.all(
            customer.imageUrls.map((url) => deleteFromS3(extractKeyFromUrl(url)))
          );
        }
        
        // Wait for all delete operations to complete
        await Promise.all(deletePromises);
        
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete customer",
          cause: error,
        });
      }
    }),

  // Search customers by name or email
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { query, limit } = input;
        const searchTerm = `%${query}%`;
        
        const results = await ctx.db.select()
          .from(customers)
          .where(
            or(
              like(customers.name, searchTerm),
              like(customers.email, searchTerm)
            )
          )
          .orderBy(desc(customers.updatedAt))
          .limit(limit);
          
        return results;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search customers",
          cause: error,
        });
      }
    }),
});
