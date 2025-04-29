import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  customerImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => {
      // For now, allow all uploads without authentication
      return { userId: "mock-user-id" };
    })
    .onUploadComplete(async ({ metadata, file }: { metadata: { userId: string }, file: { url: string } }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 