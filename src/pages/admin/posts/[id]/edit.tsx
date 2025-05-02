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
      onSuccess: (data) => {
        setFormData({
          title: data.title,
          content: data.content,
          author_name: data.author_name || "",
          is_active: data.is_active,
          is_question: data.is_question,
        });
        
        // Set existing images if any
        if (data.image_urls && data.image_urls.length > 0) {
          setExistingImageUrls(data.image_urls);
        }
        
        setIsLoading(false);
      },
      onError: (err) => {
        setError(`Failed to load post: ${err.message}`);
        setIsLoading(false);
      }
    }
  );
  
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
      console.error('Error converting images to base64:', error);
      return [];
    }
  };
  
  // Process images for upload (client-side optimization)
  const processImages = async (files: File[]): Promise<string[]> => {
    if (!files.length) return [];
    
    // Ensure the first image (thumbnail) is processed first
    const thumbnailFile = files[thumbnailIndex];
    const otherFiles = files.filter((_, index) => index !== thumbnailIndex);
    
    // Process the thumbnail first, then the rest
    // Make sure we don't include undefined values
    const processedFiles: File[] = [];
    if (thumbnailFile) processedFiles.push(thumbnailFile);
    processedFiles.push(...otherFiles.filter((file): file is File => file !== undefined));
    
    // In a real implementation, we would optimize images here with Sharp
    // For the thumbnail, we would ensure it's less than 50KB
    // For other images, we would ensure they're less than 120KB
    // All images would be converted to WebP format
    
    // For now, we'll just convert them to base64 strings
    // But we'll simulate the optimization by logging what would happen
    console.log(`Thumbnail image would be optimized to WebP format and < 50KB`);
    console.log(`${otherFiles.length} other images would be optimized to WebP format and < 120KB each`);
    
    return await convertImagesToBase64(processedFiles);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Process images if any
      let imageUrls: string[] = [...existingImageUrls]; // Start with existing images
      
      if (uploadedImages.length > 0) {
        setIsUploadingImages(true);
        
        // Process and convert images
        const processedImageUrls = await processImages(uploadedImages);
        
        if (processedImageUrls.length > 0) {
          // If we're replacing all images
          imageUrls = processedImageUrls;
        }
        
        setIsUploadingImages(false);
      }
      
      // Update the post with the form data and processed images
      await updateMutation.mutateAsync({
        id: id as string,
        title: formData.title,
        content: formData.content,
        author_name: formData.author_name || undefined,
        is_active: formData.is_active,
        is_question: formData.is_question,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      });
      
    } catch (error) {
      console.error("Error updating post:", error);
      setError("Failed to update post. Please try again.");
      setIsSubmitting(false);
    }
  };
  
  // Show loading state while fetching post data
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
  if (error && !post) {
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
          {error}
        </div>
      </div>
    );
  }
  
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
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-500">
          {error}
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
