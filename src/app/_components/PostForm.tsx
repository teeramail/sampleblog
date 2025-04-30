"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Constants for file size limits
const MAX_THUMBNAIL_SIZE = 30 * 1024; // 30KB
const MAX_IMAGE_SIZE = 120 * 1024; // 120KB
const MAX_GALLERY_IMAGES = 10; // Maximum 10 images per post

// Default props type for the form
type PostFormProps = {
  initialData?: {
    id: string;
    subject: string;
    content: string;
    thumbnailUrl: string;
    imageUrls: string[];
    isActive: boolean;
  };
  isEditMode?: boolean;
};

export function PostForm({ initialData, isEditMode = false }: PostFormProps) {
  const router = useRouter();
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    subject: initialData?.subject || "",
    content: initialData?.content || "",
    isActive: initialData?.isActive ?? true,
    thumbnailUrl: initialData?.thumbnailUrl || "",
    imageUrls: initialData?.imageUrls || [],
  });
  
  const [uploading, setUploading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(formData.thumbnailUrl);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(formData.imageUrls);
  const [isCreatingNewSubject, setIsCreatingNewSubject] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Fetch existing subjects
  const {
    data: subjects,
    isLoading: isLoadingSubjects,
  } = api.post.getSubjects.useQuery();
  
  // Determine if the current subject is new
  useEffect(() => {
    if (subjects && subjects.length > 0 && formData.subject) {
      setIsCreatingNewSubject(!subjects.includes(formData.subject));
    }
  }, [subjects, formData.subject]);
  
  // Create or update mutation
  const createMutation = api.post.create.useMutation({
    onSuccess: () => {
      router.push("/admin/posts");
    },
  });
  
  const updateMutation = api.post.update.useMutation({
    onSuccess: () => {
      router.push(`/admin/posts/${initialData?.id}`);
    },
  });
  
  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Check if creating a new subject
    if (name === "subject" && subjects) {
      setIsCreatingNewSubject(!subjects.includes(value) && value.trim() !== "");
    }
  };
  
  // Handle subject selection
  const handleSubjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === "new") {
      setIsCreatingNewSubject(true);
      setFormData(prev => ({
        ...prev,
        subject: ""
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        subject: value
      }));
      setIsCreatingNewSubject(false);
    }
  };
  
  // Handle thumbnail file selection
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
      // Use a default ID if postId is not available (for new posts)
      const uploadPostId = initialData?.id ?? 'temp-' + Date.now();
      formData.append('postId', uploadPostId);

      // Set uploading state
      setUploading(true);
      
      // Upload the file to the server
      const response = await fetch('/api/post-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Don't show "Post ID is required" errors since we're providing a temp ID
        if (errorData.message && errorData.message.includes("Post ID is required")) {
          throw new Error("Upload failed. Please save post information first.");
        }
        throw new Error(errorData.message ? String(errorData.message) : "Failed to upload thumbnail");
      }

      const data = await response.json();
      const url = typeof data.url === 'string' ? data.url : '';
      
      // Set the thumbnail URL to the S3 URL returned by the server
      setThumbnailPreview(url);
      setFormData(prev => ({
        ...prev,
        thumbnailUrl: url
      }));
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      const message = error instanceof Error ? error.message : "Unknown upload error";
      setThumbnailError(message);
      
      // Clear the file input
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  };
  
  // Remove thumbnail
  const removeThumbnail = () => {
    setThumbnailPreview('');
    setFormData(prev => ({
      ...prev,
      thumbnailUrl: ''
    }));
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };
  
  // Handle gallery files selection
  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setGalleryError(null);

    // Check if adding these files would exceed the maximum
    if (formData.imageUrls.length + files.length > MAX_GALLERY_IMAGES) {
      setGalleryError(`You can only upload up to ${MAX_GALLERY_IMAGES} images (${formData.imageUrls.length} already uploaded)`);
      return;
    }

    // Validate each file size individually
    const oversizedFiles = Array.from(files).filter(file => file.size > MAX_IMAGE_SIZE);
    if (oversizedFiles.length > 0) {
      setGalleryError(`Each image must be less than ${MAX_IMAGE_SIZE / 1024}KB. ${oversizedFiles.length} file(s) exceed this limit.`);
      return;
    }

    // Set uploading state
    setUploading(true);

    // Upload each file individually
    const newImageUrls = [...formData.imageUrls];
    const newGalleryPreviews = [...galleryPreviews];
    
    try {
      // Process files one by one
      for (const file of Array.from(files)) {
        try {
          // Create a FormData object to upload the file
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'gallery');
          // Use a default ID if postId is not available (for new posts)
          const uploadPostId = initialData?.id ?? 'temp-' + Date.now();
          formData.append('postId', uploadPostId);

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
      // Files have already been uploaded at this point, so we just submit the form data
      if (isEditMode && initialData?.id) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          ...formData
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      
      // Success - redirect handled in mutation callbacks
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("An error occurred while saving the post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
          Subject
        </label>
        
        {isLoadingSubjects ? (
          <div className="mt-1 flex h-10 items-center">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-500">Loading subjects...</span>
          </div>
        ) : subjects && subjects.length > 0 ? (
          <div className="mt-1 space-y-2">
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              value={isCreatingNewSubject ? "new" : formData.subject}
              onChange={handleSubjectSelect}
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
              <option value="new">+ Create new subject</option>
            </select>
            
            {isCreatingNewSubject && (
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Enter new subject"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            )}
          </div>
        ) : (
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        )}
      </div>
      
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          rows={6}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <div className="mt-1 flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Active
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Thumbnail Image (max {MAX_THUMBNAIL_SIZE / 1024}KB)
        </label>
        <div className="mt-2">
          {thumbnailPreview ? (
            <div className="relative h-40 w-40">
              <Image
                src={thumbnailPreview}
                alt="Thumbnail preview"
                width={160}
                height={160}
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
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Gallery Images (max {MAX_GALLERY_IMAGES} images, each max {MAX_IMAGE_SIZE / 1024}KB)
        </label>
        <div className="mt-2">
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {galleryPreviews.map((url, index) => (
              <div key={index} className="relative h-32">
                <Image
                  src={url}
                  alt={`Gallery image ${index + 1}`}
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
          
          {galleryPreviews.length < MAX_GALLERY_IMAGES && (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryChange}
                ref={galleryInputRef}
                className="hidden"
                id="gallery-upload"
              />
              <label
                htmlFor="gallery-upload"
                className="cursor-pointer rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Add Gallery Images
              </label>
            </div>
          )}
          
          {galleryError && (
            <p className="mt-1 text-sm text-red-600">{galleryError}</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {(isSubmitting || uploading)
            ? 'Saving...'
            : isEditMode
            ? 'Update Post'
            : 'Create Post'
          }
        </button>
      </div>
    </form>
  );
} 