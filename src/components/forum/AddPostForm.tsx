import React, { useState } from "react";
import { api } from "~/utils/api";
import { Button, Card, Input, Textarea } from "~/components/ui";
import { ImageUploader } from "./ImageUploader";

interface AddPostFormProps {
  topicId: string;
  onPostAdded: () => void;
  onCancel: () => void;
}

export const AddPostForm: React.FC<AddPostFormProps> = ({
  topicId,
  onPostAdded,
  onCancel,
}) => {
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [imageBase64Array, setImageBase64Array] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPostMutation = api.topic.addPost.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      onPostAdded();
    },
    onError: (err) => {
      setIsSubmitting(false);
      setError(err.message);
    },
  });

  const uploadImagesMutation = api.upload.uploadForumImages.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!content.trim()) {
        throw new Error("Content is required");
      }

      if (!authorName.trim()) {
        throw new Error("Your name is required");
      }

      // Generate a temporary post ID for image upload
      const tempPostId = crypto.randomUUID();
      
      // Upload images if any
      let imageUrls: string[] = [];
      if (imageBase64Array.length > 0) {
        const uploadResult = await uploadImagesMutation.mutateAsync({
          topicId,
          postId: tempPostId,
          base64Images: imageBase64Array,
        });
        imageUrls = uploadResult.urls;
      }

      // Add post to topic
      await addPostMutation.mutateAsync({
        topicId,
        content,
        authorName,
        imageUrls,
      });
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleAddImage = (base64Image: string) => {
    setImageBase64Array((prev) => [...prev, base64Image]);
  };

  const handleRemoveImage = (index: number) => {
    setImageBase64Array((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-800">
            <p>{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="authorName" className="block font-medium text-gray-700">
            Your Name
          </label>
          <Input
            id="authorName"
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Enter your name"
            className="mt-1 w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block font-medium text-gray-700">
            Content
          </label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your post content"
            className="mt-1 w-full"
            rows={6}
            required
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700">
            Images (Optional)
          </label>
          <div className="mt-1">
            <ImageUploader
              onImageSelected={handleAddImage}
              maxSizeKB={120}
              previewHeight={150}
            />
            <p className="mt-1 text-sm text-gray-500">
              Add images to your post (max 120KB each)
            </p>
          </div>

          {imageBase64Array.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {imageBase64Array.map((base64, index) => (
                <div key={index} className="relative">
                  <img
                    src={base64}
                    alt={`Preview ${index + 1}`}
                    className="aspect-square rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Posting..." : "Post Reply"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddPostForm;
