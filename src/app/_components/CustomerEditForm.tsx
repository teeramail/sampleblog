"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";

// Constants for file size limits
const MAX_THUMBNAIL_SIZE = 30 * 1024; // 30KB
const MAX_IMAGE_SIZE = 120 * 1024; // 120KB
const MAX_IMAGES = 10;

// Form validation schema
const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerEditFormProps {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    thumbnailUrl: string | null;
    imageUrls: string[] | null;
    createdAt: Date;
    updatedAt: Date;
  };
  onSubmit: (data: {
    name: string;
    email: string;
    phone?: string;
    thumbnailUrl?: string;
    imageUrls?: string[];
  }) => void;
  isSubmitting: boolean;
  customerId?: string; // Optional prop for direct upload to S3
}

export function CustomerEditForm({
  customer,
  onSubmit,
  isSubmitting,
  customerId,
}: CustomerEditFormProps) {
  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
    },
  });

  // Image state
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    customer.thumbnailUrl
  );
  const [imageUrls, setImageUrls] = useState<string[]>(
    customer.imageUrls || []
  );
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [imagesError, setImagesError] = useState<string | null>(null);
  
  // File input refs
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  // Handle form submission
  const handleFormSubmit = (data: CustomerFormData) => {
    onSubmit({
      ...data,
      thumbnailUrl: thumbnailUrl || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    });
  };

  // Handle thumbnail upload
  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailError(null);

    // Validate file size
    if (file.size > MAX_THUMBNAIL_SIZE) {
      setThumbnailError(`Thumbnail must be less than ${MAX_THUMBNAIL_SIZE / 1024}KB`);
      return;
    }

    try {
      // Create a FormData object to upload the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'thumbnail');
      formData.append('customerId', customerId || customer.id);

      // Upload the file to the server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload thumbnail');
      }

      const data = await response.json();
      
      // Set the thumbnail URL to the S3 URL returned by the server
      setThumbnailUrl(data.url);
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      setThumbnailError(error instanceof Error ? error.message : 'Failed to upload thumbnail');
      
      // Clear the file input
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
    }
  };

  // Handle multiple image upload
  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImagesError(null);

    // Check if adding these files would exceed the maximum
    if (imageUrls.length + files.length > MAX_IMAGES) {
      setImagesError(`You can only upload up to ${MAX_IMAGES} images`);
      return;
    }

    // Validate each file size individually
    const oversizedFiles = Array.from(files).filter(file => file.size > MAX_IMAGE_SIZE);
    if (oversizedFiles.length > 0) {
      setImagesError(`Each image must be less than ${MAX_IMAGE_SIZE / 1024}KB. ${oversizedFiles.length} file(s) exceed this limit.`);
      return;
    }

    // Upload each file individually
    const newImageUrls = [...imageUrls];
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        // Create a FormData object to upload the file
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'normal');
        formData.append('customerId', customerId || customer.id);

        // Upload the file to the server
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upload image');
        }

        const data = await response.json();
        return data.url;
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    });

    try {
      // Wait for all uploads to complete
      const urls = await Promise.all(uploadPromises);
      setImageUrls([...newImageUrls, ...urls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      setImagesError(error instanceof Error ? error.message : 'Failed to upload one or more images');
      
      // Clear the file input
      if (imagesInputRef.current) {
        imagesInputRef.current.value = '';
      }
    }
  };

  // Remove thumbnail
  const removeThumbnail = () => {
    setThumbnailUrl(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  };

  // Remove image at index
  const removeImage = (index: number) => {
    const newImageUrls = [...imageUrls];
    newImageUrls.splice(index, 1);
    setImageUrls(newImageUrls);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <div className="space-y-4 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">Customer Information</h2>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              id="name"
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              {...register("phone")}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>
        
        {/* Image Upload */}
        <div className="space-y-4 rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">Images</h2>
          
          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thumbnail (max {MAX_THUMBNAIL_SIZE / 1024}KB)
            </label>
            <div className="mt-2">
              {thumbnailUrl ? (
                <div className="relative h-40 w-40">
                  <Image
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    fill
                    className="rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    ref={thumbnailInputRef}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="cursor-pointer rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Upload Thumbnail
                  </label>
                </div>
              )}
              {thumbnailError && (
                <p className="mt-1 text-sm text-red-600">{thumbnailError}</p>
              )}
            </div>
          </div>
          
          {/* Multiple Images Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Images (max {MAX_IMAGES} images, each max {MAX_IMAGE_SIZE / 1024}KB)
            </label>
            <div className="mt-2">
              <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative h-32">
                    <Image
                      src={url}
                      alt={`Image ${index + 1}`}
                      fill
                      className="rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              {imageUrls.length < MAX_IMAGES && (
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    ref={imagesInputRef}
                    className="hidden"
                    id="images-upload"
                  />
                  <label
                    htmlFor="images-upload"
                    className="cursor-pointer rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Add Images
                  </label>
                </div>
              )}
              
              {imagesError && (
                <p className="mt-1 text-sm text-red-600">{imagesError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Link
          href={`/customers/${customer.id}`}
          className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
