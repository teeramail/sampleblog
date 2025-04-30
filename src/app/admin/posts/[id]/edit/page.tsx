"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PostForm } from "~/app/_components/PostForm";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";

export default function EditPostPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { data: post, isLoading: isPostLoading, error: postError } = 
    api.post.getById.useQuery({ id: postId });
  
  useEffect(() => {
    if (isPostLoading) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
      if (postError) {
        setError("Failed to load post. Please try again.");
      }
    }
  }, [isPostLoading, postError]);
  
  return (
    <div>
      <div className="mb-6 flex items-center">
        <Link 
          href="/admin/posts" 
          className="mr-4 text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Posts
        </Link>
        <h2 className="text-2xl font-semibold">Edit Post</h2>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 text-red-500">
            {error}
          </div>
        ) : post ? (
          <PostForm 
            initialData={{
              id: post.id,
              subject: post.subject,
              content: post.content,
              thumbnailUrl: post.thumbnailUrl,
              imageUrls: post.imageUrls,
              isActive: post.isActive
            }} 
            isEditMode={true} 
          />
        ) : (
          <div className="py-8 text-center text-gray-500">
            Post not found
          </div>
        )}
      </div>
    </div>
  );
} 