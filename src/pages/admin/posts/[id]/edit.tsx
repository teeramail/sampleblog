"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "~/trpc/react";
import Link from "next/link";
import { ImageUploader } from "~/components/admin/ImageUploader";
import Image from "next/image";

export default function EditPostPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author_name: "",
    is_active: true,
    is_question: true,
  });
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch the post data
  const { data: post, isLoading: isLoadingPost, error: fetchError } = api.post.getById.useQuery(
    { id: id as string },
    { 
      enabled: !!id,
      retry: 2, // Retry failed requests twice
      retryDelay: 1000, // Wait 1 second between retries
    }
  );
  
  // Fetch content sections
  const { data: contentSections = [], isLoading: isLoadingSections } = api.post.getContentSections.useQuery(
    { postId: id as string },
    { 
      enabled: !!id,
      retry: 2,
      retryDelay: 1000
    }
  );
  
  // Handle successful data loading
  useEffect(() => {
    if (post && !isLoadingPost) {
      setFormData({
        title: post.title,
        content: post.content,
        author_name: post.author_name || "",
        is_active: post.is_active,
        is_question: post.is_question,
      });
      
      // Set existing images if any
      if (post.image_urls && post.image_urls.length > 0) {
        setExistingImageUrls(post.image_urls);
      }
      
      setIsLoading(false);
    }
  }, [post, isLoadingPost]);
  
  // Handle errors
  useEffect(() => {
    if (fetchError) {
      console.error("Error loading post:", fetchError);
      setError(`Failed to load post: ${fetchError.message}`);
      setIsLoading(false);
    }
  }, [fetchError]);
  
  // Add timeout handling for the query
  useEffect(() => {
    // Set a timeout to handle cases where the query hangs
    const timeoutId = setTimeout(() => {
      if (isLoadingPost) {
        console.log("Post fetch timeout for ID:", id);
        setError("Request timed out. The post may not exist or the database connection is slow.");
        setIsLoading(false);
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, [isLoadingPost, id]);
  
  // Update mutation
  const updateMutation = api.post.update.useMutation({
    onSuccess: () => {
      router.push("/admin/posts");
    },
    onError: (error) => {
      setError(error.message);
      setIsSubmitting(false);
    }
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
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
    
    setIsUploadingImages(true);
    
    try {
      const base64Images = await convertImagesToBase64(files);
      setIsUploadingImages(false);
      return base64Images;
    } catch (error) {
      setIsUploadingImages(false);
      setError("Failed to process images. Please try again.");
      throw error;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isUploadingImages) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Process uploaded images if any
      let processedImages: string[] = [];
      if (uploadedImages.length > 0) {
        processedImages = await processImages(uploadedImages);
      }
      
      // Prepare update data
      const updateData = {
        id: id as string,
        ...formData,
        // If we have new images, use them, otherwise keep existing ones
        image_urls: processedImages.length > 0 ? processedImages : existingImageUrls,
      };
      
      // Submit update
      await updateMutation.mutateAsync(updateData);
      
    } catch (error) {
      console.error("Error updating post:", error);
      setError("Failed to update post. Please try again.");
      setIsSubmitting(false);
    }
  };
  
  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading post data...</div>
        </div>
      </div>
    );
  }
  
  // Show error if post couldn't be loaded
  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Post</h1>
          <Link 
            href="/admin/posts"
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Back to Posts
          </Link>
        </div>
        
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          {error || "Post not found"}
        </div>
      </div>
    );
  }
  
  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Main return for the component
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <div className="flex space-x-2">
          <Link 
            href={`/admin/posts/${post.id}/add`}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Add Content
          </Link>
          <Link 
            href="/admin/posts"
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Back to Posts
          </Link>
        </div>
      </div>
      
      {/* Content Sections Preview */}
      {contentSections && contentSections.length > 0 && (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Content Sections</h2>
          <div className="space-y-6">
            {contentSections.map((section, index) => (
              <div key={section.id || index} className="border-b pb-4 mb-4 last:border-b-0">
                <div className="whitespace-pre-wrap mb-3">{section.content}</div>
                
                {section.imageUrls && section.imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {section.imageUrls.map((url, imgIndex) => (
                      <div key={`${section.id}-img-${imgIndex}`} className="relative border rounded-md overflow-hidden h-40">
                        <Image
                          src={url}
                          alt={`Section ${index + 1} Image ${imgIndex + 1}`}
                          width={150}
                          height={150}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  Added on {formatDate(section.createdAt)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>These content sections are displayed in chronological order on the post page.</p>
            <p>To add more content, use the "Add Content" button after saving your changes.</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            value={formData.title}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={6}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            value={formData.content}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label htmlFor="author_name" className="block text-sm font-medium text-gray-700">
            Author Name (optional)
          </label>
          <input
            type="text"
            id="author_name"
            name="author_name"
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            value={formData.author_name}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-6">
          {existingImageUrls.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Images
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingImageUrls.map((url, index) => (
                  <div key={index} className="relative border rounded-md overflow-hidden h-40">
                    <Image
                      src={url}
                      alt={`Image ${index + 1}`}
                      width={150}
                      height={150}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                    {index === 0 && (
                      <div className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs">
                        Thumbnail
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Upload new images below to replace the current ones
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {existingImageUrls.length > 0 ? "Replace Images" : "Images"}
            </label>
            <ImageUploader 
              onImagesChange={handleImagesChange}
              maxImages={10}
              thumbnailIndex={thumbnailIndex}
              onThumbnailChange={handleThumbnailChange}
            />
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                checked={formData.is_active}
                onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_question"
                name="is_question"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                checked={formData.is_question}
                onChange={e => setFormData(prev => ({ ...prev, is_question: e.target.checked }))}
              />
              <label htmlFor="is_question" className="ml-2 block text-sm text-gray-700">
                Is Question
              </label>
            </div>
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
                ? "Updating Post..." 
                : "Update Post"}
          </button>
        </div>
      </form>
    </div>
  );
}