"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "~/trpc/react";
import Link from "next/link";
import { ImageUploader } from "~/components/admin/ImageUploader";
import Image from "next/image";
import toast from "react-hot-toast";

export default function EditSectionPage() {
  const router = useRouter();
  const { id, sectionId } = router.query;
  
  const [content, setContent] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch the post data
  const { data: post } = api.post.getById.useQuery(
    { id: id as string },
    { 
      enabled: !!id,
      retry: 2,
    }
  );
  
  // Fetch the content section
  const { data: section, isLoading: isSectionLoading, error: sectionError } = api.post.getContentSectionById.useQuery(
    { id: sectionId as string },
    { 
      enabled: !!sectionId,
      retry: 2,
    }
  );
  
  // Handle successful data loading
  useEffect(() => {
    if (section && !isSectionLoading) {
      setContent(section.content || "");
      
      // Set existing images if any
      if (section.imageUrls && section.imageUrls.length > 0) {
        setExistingImageUrls(section.imageUrls);
      }
      
      setIsLoading(false);
    }
  }, [section, isSectionLoading]);
  
  // Handle errors
  useEffect(() => {
    if (sectionError) {
      console.error("Error loading section:", sectionError);
      setError(`Failed to load section: ${sectionError.message}`);
      setIsLoading(false);
    }
  }, [sectionError]);
  
  // Update section mutation
  const updateSectionMutation = api.post.updateContentSection.useMutation({
    onSuccess: () => {
      toast.success("Section updated successfully");
      router.push(`/admin/posts/${id}`);
    },
    onError: (error) => {
      toast.error(`Failed to update section: ${error.message}`);
      setError(error.message);
      setIsSubmitting(false);
    }
  });
  
  // Handle image uploads
  const handleImagesChange = useCallback((files: File[]) => {
    setUploadedImages(files);
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
        id: sectionId as string,
        content,
        // If we have new images, use them, otherwise keep existing ones
        imageUrls: processedImages.length > 0 ? processedImages : existingImageUrls,
      };
      
      // Submit update
      await updateSectionMutation.mutateAsync(updateData);
      
    } catch (error) {
      console.error("Error updating section:", error);
      setError("Failed to update section. Please try again.");
      setIsSubmitting(false);
    }
  };
  
  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading section data...</div>
        </div>
      </div>
    );
  }
  
  // Show error if section couldn't be loaded
  if (error || !section) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Section</h1>
          <Link 
            href={`/admin/posts/${id}`}
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Back to Post
          </Link>
        </div>
        
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          {error || "Section not found"}
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
        <h1 className="text-2xl font-bold">Edit Content Section</h1>
        <Link 
          href={`/admin/posts/${id}`}
          className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Back to Post
        </Link>
      </div>
      
      <div className="mb-4 text-sm text-gray-500">
        <p>Post: {post?.title}</p>
        <p>Section added on: {formatDate(section.createdAt)}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
            />
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
                ? "Updating Section..." 
                : "Update Section"}
          </button>
        </div>
      </form>
    </div>
  );
}
