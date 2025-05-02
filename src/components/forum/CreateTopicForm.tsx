import React, { useState } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { Button, Card, Container, Input, Textarea } from "~/components/ui";
import { ImageUploader } from "./ImageUploader";

export const CreateTopicForm: React.FC = () => {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [thumbnailBase64, setThumbnailBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTopicMutation = api.topic.create.useMutation({
    onSuccess: (data) => {
      setIsSubmitting(false);
      void router.push(`/forum/topics/${data.id}`);
    },
    onError: (err) => {
      setIsSubmitting(false);
      setError(err.message);
    },
  });

  const uploadThumbnailMutation = api.upload.uploadTopicThumbnail.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!subject.trim()) {
        throw new Error("Subject is required");
      }

      if (!content.trim()) {
        throw new Error("Content is required");
      }

      if (!authorName.trim()) {
        throw new Error("Your name is required");
      }

      if (!thumbnailBase64) {
        throw new Error("Thumbnail image is required");
      }

      // Generate a temporary topic ID for image upload
      const tempTopicId = crypto.randomUUID();

      // Upload thumbnail
      const thumbnailResult = await uploadThumbnailMutation.mutateAsync({
        topicId: tempTopicId,
        base64Image: thumbnailBase64,
      });

      // Create topic with initial post
      await createTopicMutation.mutateAsync({
        subject,
        thumbnailUrl: thumbnailResult.url,
        authorName,
        content,
        imageUrls: [], // No additional images for initial post
      });
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleCancel = () => {
    router.push("/forum");
  };

  return (
    <Container className="py-8">
      <div className="mb-6">
        <Button onClick={handleCancel} variant="outline" className="mb-4">
          ← Back to Topics
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Topic</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-red-800">
              <p>{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="subject" className="block font-medium text-gray-700">
              Subject
            </label>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter topic subject"
              className="mt-1 w-full"
              required
            />
          </div>

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
            <label className="block font-medium text-gray-700">
              Thumbnail Image
            </label>
            <div className="mt-1">
              <ImageUploader
                onImageSelected={setThumbnailBase64}
                maxSizeKB={30}
                aspectRatio={16/9}
                previewHeight={200}
              />
              <p className="mt-1 text-sm text-gray-500">
                Select a thumbnail image for your topic (max 30KB)
              </p>
            </div>
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

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Topic"}
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  );
};

export default CreateTopicForm;
