import { type NextApiRequest } from "next";
import formidable from "formidable";
import { z } from "zod";
import type { File } from "formidable";

// Make schema available for export if needed later
export const uploadSchema = z.object({
  type: z.enum(["thumbnail", "normal"]),
  customerId: z.string(),
});

// File type definition for use in other modules
export type UploadedFile = {
  filepath: string;
  originalFilename: string;
  mimetype: string;
};

export interface FileRequest extends NextApiRequest {
  files?: Record<string, File[]>;
}

export async function parseUploadRequest(
  req: NextApiRequest,
): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  try {
    const form = formidable();
    return await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(new Error("Failed to parse form data"));
        resolve({ fields, files });
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";
    throw new Error(message);
  }
}

export const parseMultipartForm = async (
  req: FileRequest
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 120 * 1024, // 120KB max file size
      multiples: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        reject(new Error("Failed to parse form data: " + errorMessage));
        return;
      }
      if (!files || Object.keys(files).length === 0) {
        reject(new Error("No file uploaded"));
        return;
      }
      resolve({ fields, files });
    });
  });
};
