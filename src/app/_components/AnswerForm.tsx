"use client";

import { useState, useRef } from "react";
import { api } from "~/trpc/react";
import Image from "next/image";
import { MAX_IMAGES_PER_POST } from "~/server/api/utils/imageValidation";

// Maximum size for regular images (in KB)
const MAX_IMAGE_SIZE = 120 * 1024; // 120KB

// Props type for the answer form
type AnswerFormProps = {
  postId: string;
  onSuccess?: () => void;
};

export function AnswerForm({ postId, onSuccess }: AnswerFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    content: "",
    imageUrls: [] as string[],
    authorName: "",
  });
  
  // UI state
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();
  
  // Remaining image capacity calculation
  const remainingCapacity = MAX_IMAGES_PER_POST - formData.imageUrls.length;
  
  // Create answer mutation
  const createMutation = api.answer.create.useMutation({
    onSuccess: () => {
      // Clear the form
      setFormData({
        content: "",
        imageUrls: [],
        authorName: "",
      });
      setGalleryPreviews([]);
      
      // Invalidate the answer list query to refresh data
      utils.answer.getByPostId.invalidate({ postId });
      
      // Call onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
  });
  
  // Handle text input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
    if (formData.imageUrls.length + files.length > MAX_IMAGES_PER_POST) {
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
    const newImageUrls = [...formData.imageUrls];
    const newGalleryPreviews = [...galleryPreviews];
    
    try {
      // Process files one by one
      for (const file of Array.from(files)) {
        try {
          // Create a FormData object to upload the file
          const formDataObj = new FormData();
          formDataObj.append('file', file);
          formDataObj.append('type', 'gallery');
          formDataObj.append('postId', postId);

          // Upload the file to the server
          const response = await fetch('/api/post-upload', {
            method: 'POST',
            body: formDataObj,
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
        imageUrls: newImageUrls
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
    const newImageUrls = [...formData.imageUrls];
    newImageUrls.splice(index, 1);
    
    const newGalleryPreviews = [...galleryPreviews];
    newGalleryPreviews.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      imageUrls: newImageUrls
    }));
    setGalleryPreviews(newGalleryPreviews);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      // Submit the form data to create an answer
      await createMutation.mutateAsync({
        postId,
        content: formData.content,
        imageUrls: formData.imageUrls,
        authorName: formData.authorName || undefined
      });
      
      // Success is handled in the onSuccess callback
    } catch (err) {
      console.error("Error creating answer:", err);
      setError("An error occurred while saving your answer. Please try again.");
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
      
      {/* Name input */}
      <div>
        <label htmlFor="authorName" className="block text-sm font-medium text-gray-700">
          Your Name (optional)
        </label>
        <input
          type="text"
          id="authorName"
          name="authorName"
          value={formData.authorName}
          onChange={handleChange}
          placeholder="Enter your name or leave blank to remain anonymous"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>
      
      {/* Answer content textarea */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Your Answer
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          rows={5}
          placeholder="Type your answer here..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>
      
      {/* Gallery image upload section */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Add Images ({remainingCapacity} remaining of {MAX_IMAGES_PER_POST} max)
        </label>
        
        {/* Image preview grid */}
        {galleryPreviews.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 mt-2">
            {galleryPreviews.map((url, index) => (
              <div key={index} className="relative h-24 w-24">
                <Image
                  src={url}
                  alt={`Image ${index + 1}`}
                  fill
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(index)}
                  className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Upload button */}
        <div className="mt-2 flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-4">
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
            className={`cursor-pointer rounded px-3 py-1 text-sm text-white ${remainingCapacity > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}
          >
            {uploading ? 'Uploading...' : `Add Images (${remainingCapacity} remaining)`}
          </label>
        </div>
        
        {galleryError && (
          <p className="mt-1 text-sm text-red-600">{galleryError}</p>
        )}
      </div>
      
      {/* Form buttons */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || uploading || !formData.content.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {(isSubmitting || uploading)
            ? 'Submitting...'
            : 'Submit Answer'
          }
        </button>
      </div>
    </form>
  );
} 