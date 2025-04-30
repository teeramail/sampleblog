"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) {
        setThumbnailFile(file);
        
        // Create a preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setThumbnailPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };
  
  // Handle gallery files selection
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setGalleryFiles(prevFiles => [...prevFiles, ...filesArray]);
      
      // Create previews
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  // Remove gallery preview
  const removeGalleryPreview = (index: number) => {
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle mock uploads for this implementation
  // In a real app, you'd use the upload API to upload files to S3
  const handleMockUpload = async () => {
    setUploading(true);
    
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock URLs
      let thumbnailUrl = formData.thumbnailUrl;
      if (thumbnailFile) {
        thumbnailUrl = `/mock-uploads/thumbnail-${Date.now()}.jpg`;
      }
      
      let newImageUrls = [...formData.imageUrls];
      if (galleryFiles.length > 0) {
        const mockGalleryUrls = galleryFiles.map((_, index) => 
          `/mock-uploads/gallery-${Date.now()}-${index}.jpg`
        );
        newImageUrls = [...newImageUrls, ...mockGalleryUrls];
      }
      
      return {
        thumbnailUrl,
        imageUrls: newImageUrls
      };
    } finally {
      setUploading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      // First handle file uploads
      const { thumbnailUrl, imageUrls } = await handleMockUpload();
      
      // Prepare submission data
      const submissionData = {
        ...formData,
        thumbnailUrl,
        imageUrls
      };
      
      // Submit to API
      if (isEditMode && initialData?.id) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          ...submissionData
        });
      } else {
        await createMutation.mutateAsync(submissionData);
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
          Thumbnail Image
        </label>
        <div className="mt-2">
          <input
            type="file"
            ref={thumbnailInputRef}
            onChange={handleThumbnailChange}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => thumbnailInputRef.current?.click()}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {thumbnailPreview ? "Change Thumbnail" : "Upload Thumbnail"}
          </button>
          
          {thumbnailPreview && (
            <div className="mt-2">
              <Image
                src={thumbnailPreview}
                alt="Thumbnail preview"
                width={100}
                height={100}
                className="h-24 w-24 rounded object-cover"
              />
            </div>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Gallery Images
        </label>
        <div className="mt-2">
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleGalleryChange}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Add Gallery Images
          </button>
          
          {galleryPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <Image
                    src={preview}
                    alt={`Gallery image ${index + 1}`}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryPreview(index)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
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