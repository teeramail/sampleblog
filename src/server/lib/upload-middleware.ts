import type { NextApiRequest } from "next";
import formidable from "formidable";
import type { File } from "formidable";

export interface FileRequest extends NextApiRequest {
  files?: Record<string, File[]>;
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
        reject(new Error("Failed to parse form data: " + err.message));
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
