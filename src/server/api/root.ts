import { uploadRouter } from "~/server/api/routers/upload";
import { customerRouter } from "~/server/api/routers/customer";
import { postRouter } from "~/server/api/routers/post";
import { answerRouter } from "~/server/api/routers/answer";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  upload: uploadRouter,
  customer: customerRouter,
  post: postRouter,
  answer: answerRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
