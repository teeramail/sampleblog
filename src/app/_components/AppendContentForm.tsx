"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MAX_IMAGES_PER_POST } from "~/server/api/utils/imageValidation";

// Maximum size for regular images (in KB)
const MAX_IMAGE_SIZE = 120 * 1024; // 120KB

// Props type for the append form
type AppendContentFormProps = {
  postId: string;
  subject: string;
  existingImageCount: number;
  onCancel?: () => void;
};

export function AppendContentForm({
  postId,
  subject,
  existingImageCount,
  onCancel
}: AppendContentFormProps) {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    newContent: "",
    newImageUrls: [] as string[],
  });
  
  // UI state
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  
  // Remaining image capacity calculation
  const remainingCapacity = MAX_IMAGES_PER_POST - existingImageCount - formData.newImageUrls.length;
  
  // Append content mutation
  const appendMutation = api.post.appendContent.useMutation({
    onSuccess: () => {
      router.push(`/admin/posts/${postId}`);
    },
  });
  
  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle gallery image upload
  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setGalleryError(null);
    
    // Check if adding these files would exceed the limit
    if (existingImageCount + formData.newImageUrls.length + files.length > MAX_IMAGES_PER_POST) {
      setGalleryError(`Cannot add ${files.length} images. You can only add ${remainingCapacity} more image(s).`);
      return;
    }
    
    // Validate file sizes
    for (const file of Array.from(files)) {
      if (file.size > MAX_IMAGE_SIZE) {
        setGalleryError(`Image ${file.name} exceeds ${MAX_IMAGE_SIZE / 1024}KB size limit.`);
        return;
      }
    }
    
    setUploading(true);
    
    // Keep current images
    const newImageUrls = [...formData.newImageUrls];
    const newGalleryPreviews = [...galleryPreviews];
    
    try {
      // Process files one by one
      for (const file of Array.from(files)) {
        try {
          // Create a FormData object to upload the file
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'gallery');
          formData.append('postId', postId);

          // Upload the file to the server
          const response = await fetch('/api/post-upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message ? String(errorData.message) : "Failed to upload image");
          }

          const data = await response.json();
          const url = typeof data.url === 'string' ? data.url : '';
          
          // Add to our collected URLs and previews
          newImageUrls.push(url);
          newGalleryPreviews.push(url);
        } catch (error) {
          console.error('Error uploading gallery image:', error);
          throw error;
        }
      }

      // Update state with all successfully uploaded images
      setFormData(prev => ({
        ...prev,
        newImageUrls: newImageUrls
      }));
      setGalleryPreviews(newGalleryPreviews);
      
    } catch (error) {
      console.error('Error uploading images:', error);
      setGalleryError(error instanceof Error ? error.message : 'Failed to upload one or more images');
    } finally {
      setUploading(false);
      // Clear the file input
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };
  
  // Remove gallery image
  const removeGalleryImage = (index: number) => {
    const newImageUrls = [...formData.newImageUrls];
    newImageUrls.splice(index, 1);
    
    const newGalleryPreviews = [...galleryPreviews];
    newGalleryPreviews.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      newImageUrls: newImageUrls
    }));
    setGalleryPreviews(newGalleryPreviews);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      // Submit the form data to the appendContent procedure
      await appendMutation.mutateAsync({
        id: postId,
        newContent: formData.newContent,
        newImageUrls: formData.newImageUrls
      });
      
      // Success - redirect handled in mutation callback
    } catch (err) {
      console.error("Error appending content:", err);
      setError("An error occurred while saving additional content. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      {/* Read-only subject display */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Post Subject
        </label>
        <div className="mt-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
          {subject}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Adding content to existing post
        </p>
      </div>
      
      {/* New content textarea */}
      <div>
        <label htmlFor="newContent" className="block text-sm font-medium text-gray-700">
          Additional Content
        </label>
        <textarea
          id="newContent"
          name="newContent"
          value={formData.newContent}
          onChange={handleChange}
          required
          rows={8}
          placeholder="Enter the additional content you want to append to this post..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>
      
      {/* Gallery image upload section */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Additional Images ({remainingCapacity} remaining of {MAX_IMAGES_PER_POST} max)
        </label>
        
        {/* Display a message if no more images can be added */}
        {remainingCapacity <= 0 ? (
          <div className="mt-2 rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Maximum image limit reached</h3>
                <p className="mt-2 text-sm text-yellow-700">
                  This post already has the maximum number of images allowed ({MAX_IMAGES_PER_POST}).
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            {/* Image preview grid */}
            {galleryPreviews.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {galleryPreviews.map((url, index) => (
                  <div key={index} className="relative h-32">
                    <Image
                      src={url}
                      alt={`Additional image ${index + 1}`}
                      fill
                      className="rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload button */}
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryChange}
                ref={galleryInputRef}
                className="hidden"
                id="gallery-upload"
                disabled={uploading || remainingCapacity <= 0}
              />
              <label
                htmlFor="gallery-upload"
                className={`cursor-pointer rounded px-4 py-2 text-white ${remainingCapacity > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}
              >
                Add Images ({remainingCapacity} remaining)
              </label>
            </div>
            
            {galleryError && (
              <p className="mt-1 text-sm text-red-600">{galleryError}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Form buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel ?? (() => router.push(`/admin/posts/${postId}`))}
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || uploading || !formData.newContent.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {(isSubmitting || uploading)
            ? 'Saving...'
            : 'Append'
          }
        </button>
      </div>
    </form>
  );
} 