import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerAuthSession } from "~/server/auth";

const f = createUploadthing();

export const ourFileRouter = {
  customerImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => {
      const session = await getServerAuthSession();
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }: { metadata: { userId: string }, file: { url: string } }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 