import React, { useState } from 'react';
import { api } from '~/trpc/react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface AnswerFormProps {
  postId: string;
  onAnswerAdded?: () => void;
}

export function AnswerForm({ postId, onAnswerAdded }: AnswerFormProps) {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  const createAnswer = api.answer.create.useMutation({
    onSuccess: () => {
      // Reset form and notify
      setContent('');
      setAuthorName('');
      setImageUrls([]);
      toast.success('Answer submitted successfully!');
      if (onAnswerAdded) {
        onAnswerAdded();
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please enter some content for your answer');
      return;
    }
    
    createAnswer.mutate({
      postId,
      content,
      authorName: authorName || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files);
    }
  };

  const uploadFiles = async (files: FileList) => {
    setIsUploading(true);
    
    const newImageUrls: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file || !file.type.startsWith('image/')) {
          continue;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/post-upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload image');
        }
        
        const data = await response.json();
        newImageUrls.push(data.url);
      }
      
      setImageUrls(prev => [...prev, ...newImageUrls]);
      toast.success(`${newImageUrls.length} image(s) uploaded`);
    } catch (error) {
      toast.error('Error uploading images');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-semibold">Add Your Answer</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="author-name" className="mb-1 block text-sm font-medium text-gray-700">
            Your Name (optional)
          </label>
          <input
            id="author-name"
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="Enter your name"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="answer-content" className="mb-1 block text-sm font-medium text-gray-700">
            Your Answer
          </label>
          <textarea
            id="answer-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="Write your answer here..."
            required
          />
        </div>
        
        {/* Image Upload Section - Separate Card */}
        <div className="mb-6 rounded-lg border border-gray-200 p-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Add Images (optional)
          </label>
          
          <div 
            className={`mb-4 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-1 text-sm text-gray-500">
                Drag and drop images, or{' '}
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  browse
                </span>
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={handleFileChange}
              />
            </div>
          </div>
          
          {isUploading && (
            <div className="mb-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Uploading images...</p>
            </div>
          )}
          
          {imageUrls.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Uploaded Images:</p>
              <div className="grid grid-cols-3 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="group relative">
                    <div className="relative aspect-square overflow-hidden rounded-md">
                      <Image
                        src={url}
                        alt={`Uploaded image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={createAnswer.isPending || isUploading}
          className={`rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 ${
            (createAnswer.isPending || isUploading) ? 'cursor-not-allowed opacity-70' : ''
          }`}
        >
          {createAnswer.isPending ? 'Submitting...' : 'Submit Answer'}
        </button>
      </form>
    </div>
  );
} 