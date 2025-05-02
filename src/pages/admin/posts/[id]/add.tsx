"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import { api } from "~/trpc/react";
import Link from "next/link";

export default function AddContentPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the post data to display title
  const { data: post, isLoading: isLoadingPost, error: postError } = api.post.getById.useQuery(
    { id: id as string },
    { 
      enabled: !!id,
    }
  );
  
  // Handle post fetch error
  React.useEffect(() => {
    if (postError) {
      setError(`Failed to load post: ${postError.message}`);
    }
  }, [postError]);
  
  // Append content mutation
  const appendMutation = api.post.appendContent.useMutation({
    onSuccess: () => {
      router.push(`/admin/posts/${id}`);
    },
    onError: (error) => {
      setError(error.message);
      setIsSubmitting(false);
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newContent.trim()) {
      setError("Content cannot be empty");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await appendMutation.mutateAsync({
        id: id as string,
        newContent: newContent
      });
    } catch (error) {
      // Error is handled by the mutation's onError
      console.error("Error adding content:", error);
    }
  };
  
  // Show loading state while fetching post data
  if (isLoadingPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading post data...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add Content to Post</h1>
        <Link 
          href={`/admin/posts/${id}`}
          className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          Back to Post
        </Link>
      </div>
      
      {post && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{post.title}</h2>
          <p className="text-gray-500">
            Adding new content to this post. The original content will be preserved.
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-500">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="newContent" className="block text-sm font-medium text-gray-700">
            New Content
          </label>
          <textarea
            id="newContent"
            name="newContent"
            rows={10}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Enter new content to add to this post..."
          />
          <p className="mt-2 text-sm text-gray-500">
            This content will be added to the existing post with a timestamp.
          </p>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Adding Content..." : "Add Content"}
          </button>
        </div>
      </form>
    </div>
  );
}
