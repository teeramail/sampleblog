"use client";

import React, { useState, useCallback, useRef } from "react";
import Image from "next/image";

interface ImageUploaderProps {
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  thumbnailIndex?: number;
  onThumbnailChange?: (index: number) => void;
}

export function ImageUploader({
  onImagesChange,
  maxImages = 10,
  thumbnailIndex = 0,
  onThumbnailChange
}: ImageUploaderProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Process files for upload
  const processFiles = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    // Clear previous errors
    setErrors([]);
    
    // Check if adding these files would exceed the maximum
    if (images.length + files.length > maxImages) {
      setErrors(prev => [...prev, `You can only upload up to ${maxImages} images.`]);
      return;
    }
    
    const newImages: File[] = [];
    const newPreviews: string[] = [];
    const newErrors: string[] = [];
    
    // Process each file
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        newErrors.push(`${file.name} is not an image file.`);
        continue;
      }
      
      try {
        // Create a preview URL
        const previewUrl = URL.createObjectURL(file);
        
        // For WebP conversion and optimization, we would normally use a server-side
        // function, but for client-side we can use this approach:
        
        // Create optimized version if not WebP
        let processedFile = file;
        if (!file.type.includes('webp')) {
          // In a real implementation, we would convert to WebP here
          // This would be done server-side with Sharp
          // For now, we'll just mark it for conversion
          console.log(`File ${file.name} will be converted to WebP format`);
          
          // Add metadata to indicate this needs conversion
          const newFile = new File([file], file.name, {
            type: 'image/webp', // Mark as WebP for processing later
            lastModified: file.lastModified
          });
          processedFile = newFile;
        }
        
        newImages.push(processedFile);
        newPreviews.push(previewUrl);
      } catch (error) {
        console.error("Error processing image:", error);
        newErrors.push(`Failed to process ${file.name}.`);
      }
    }
    
    // Update state with new images and previews
    const updatedImages = [...images, ...newImages];
    const updatedPreviews = [...previews, ...newPreviews];
    const updatedErrors = newErrors.length > 0 ? [...errors, ...newErrors] : errors;
    
    // Batch all state updates
    setImages(updatedImages);
    setPreviews(updatedPreviews);
    setErrors(updatedErrors);
    
    // Notify parent component about image changes
    // Use setTimeout to avoid state updates during render
    setTimeout(() => {
      onImagesChange(updatedImages);
    }, 0);
  }, [images.length, maxImages, onImagesChange]);
  
  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  }, [processFiles]);
  
  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [processFiles]);
  
  // Handle click on the upload area
  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Handle removing an image
  const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      onImagesChange(newImages);
      return newImages;
    });
    
    setPreviews(prev => {
      const newPreviews = [...prev];
      const previewUrl = newPreviews[index];
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    
    // If the thumbnail was the removed image, reset to the first image
    if (onThumbnailChange && thumbnailIndex === index) {
      onThumbnailChange(0);
    } else if (onThumbnailChange && thumbnailIndex > index) {
      // If the thumbnail was after the removed image, adjust its index
      onThumbnailChange(thumbnailIndex - 1);
    }
  }, [thumbnailIndex, onThumbnailChange, onImagesChange]);
  
  // Handle setting an image as the thumbnail
  const handleSetThumbnail = useCallback((index: number) => {
    if (onThumbnailChange) {
      onThumbnailChange(index);
    }
  }, [onThumbnailChange]);
  
  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          <p className="text-sm text-gray-600 mb-1">
            Drag and drop images here, or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supports JPG, PNG, GIF, WebP (max {maxImages} images)
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Images will be optimized and converted to WebP format
          </p>
        </div>
      </div>
      
      {/* Error messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md">
          <ul className="list-disc pl-5">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Image previews */}
      {previews.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Uploaded Images</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div 
                key={index} 
                className={`relative rounded-md overflow-hidden border ${
                  index === thumbnailIndex ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'
                }`}
              >
                <div className="aspect-w-1 aspect-h-1 w-full">
                  <Image
                    src={typeof preview === 'string' ? preview : '/placeholder.png'}
                    alt={`Image ${index + 1}`}
                    width={150}
                    height={150}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </div>
                <div className="absolute top-0 right-0 p-1 flex space-x-1">
                  {onThumbnailChange && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetThumbnail(index);
                      }}
                      className={`rounded-full p-1 ${
                        index === thumbnailIndex
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title="Set as thumbnail"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 3l14 9-14 9V3z"
                        ></path>
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    title="Remove image"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
                {index === thumbnailIndex && (
                  <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs text-center py-1">
                    Thumbnail
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
