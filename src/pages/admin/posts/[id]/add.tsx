"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { api } from "~/trpc/react";
import Link from "next/link";
import { ImageUploader } from "~/components/admin/ImageUploader";
import { toast } from "react-hot-toast";

export default function AddContentPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  // Fetch the post data to display title
  const { data: post, isLoading: isLoadingPost, error: postError } = api.post.getById.useQuery(
    { id: id as string },
    { 
      enabled: !!id,
    }
  );
  
  // Handle post fetch error
  React.useEffect(() => {
    if (postError) {
      setError(`Failed to load post: ${postError.message}`);
    }
  }, [postError]);
  
  // Add content section mutation
  const addContentSectionMutation = api.post.addContentSection.useMutation({
    onSuccess: () => {
      setNewContent("");
      setUploadedImages([]);
      setThumbnailIndex(0);
      setIsUploadingImages(false);
      toast.success("Content added successfully!");
      router.push(`/admin/posts/${id}`);
    },
    onError: (error) => {
      console.error("Error adding content:", error);
      setError("Failed to add content. Please try again.");
      toast.error("Failed to add content. Please try again.");
    },
  });
  
  // Handle image uploads
  const handleImagesChange = useCallback((files: File[]) => {
    setUploadedImages(files);
  }, []);
  
  // Handle thumbnail selection
  const handleThumbnailChange = useCallback((index: number) => {
    setThumbnailIndex(index);
  }, []);
  
  // Convert File objects to base64 strings for submission
  const convertImagesToBase64 = async (files: File[]): Promise<string[]> => {
    if (!files.length) return [];
    
    const filePromises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = () => {
          reject(new Error(`Failed to read file: ${file.name}`));
        };
        reader.readAsDataURL(file);
      });
    });
    
    try {
      return await Promise.all(filePromises);
    } catch (error) {
      console.error("Error converting images to base64:", error);
      throw error;
    }
  };
  
  // Process images for upload (client-side optimization)
  const processImages = async (files: File[]): Promise<string[]> => {
    if (!files.length) return [];
    
    try {
      // In a real app, you might resize/compress images here
      // For now, we'll just convert them to base64
      const base64Images = await convertImagesToBase64(files);
      return base64Images;
    } catch (error) {
      console.error("Error processing images:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newContent.trim()) {
      toast.error("Please enter some content");
      setError("Content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Process images if any
      let processedImages: string[] = [];
      
      if (uploadedImages.length > 0) {
        setIsUploadingImages(true);
        try {
          processedImages = await processImages(uploadedImages);
          setIsUploadingImages(false);
        } catch (err) {
          console.error("Error processing images:", err);
          setError("Failed to process images. Please try again with smaller images.");
          setIsSubmitting(false);
          setIsUploadingImages(false);
          return;
        }
      }
      
      // Add the content section with its associated images
      await addContentSectionMutation.mutateAsync({
        postId: id as string,
        content: newContent,
        imageUrls: processedImages.length > 0 ? processedImages : undefined
      });
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error("Error adding content:", error);
      setIsSubmitting(false);
    }
  };
  
  // Show loading state while fetching post data
  if (isLoadingPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading post data...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add Content to Post</h1>
        <Link 
          href={`/admin/posts/${id}`}
          className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Back to Post
        </Link>
      </div>
      
      {post && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{post.title}</h2>
          <p className="text-gray-500">
            Adding new content to this post. The original content will be preserved.
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-500">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="newContent" className="block text-sm font-medium text-gray-700">
            New Content
          </label>
          <textarea
            id="newContent"
            name="newContent"
            rows={10}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Enter new content to add to this post..."
          />
          <p className="mt-2 text-sm text-gray-500">
            This content will be added to the existing post with a timestamp.
          </p>
        </div>
        
        <div className="space-y-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images
            </label>
            <ImageUploader 
              onImagesChange={handleImagesChange}
              maxImages={10}
              thumbnailIndex={thumbnailIndex}
              onThumbnailChange={handleThumbnailChange}
            />
            <p className="mt-2 text-sm text-gray-500">
              Upload images to include with this content. The first image (or selected thumbnail) will be displayed prominently.
            </p>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isUploadingImages}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploadingImages 
              ? "Processing Images..." 
              : isSubmitting 
                ? "Adding Content..." 
                : "Add Content"}
          </button>
        </div>
      </form>
    </div>
  );
}
