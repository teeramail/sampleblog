"use client";

import { useState, useEffect } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { AppendContentForm } from "~/app/_components/AppendContentForm";

export default function AppendContentPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { data: post, isLoading: isPostLoading, error: postError } = 
    api.post.getById.useQuery({ id: postId });
  
  useEffect(() => {
    if (!isPostLoading) {
      setIsLoading(false);
      if (postError) {
        setError("Error loading post details");
      }
    }
  }, [isPostLoading, postError]);
  
  // Redirect to 404 if post not found
  if (!isLoading && !post) {
    router.push('/404');
    return null;
  }
  
  // Get the existing image count
  const existingImageCount = post && Array.isArray(post.imageUrls) ? post.imageUrls.length : 0;
  
  return (
    <main className="container mx-auto p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold">Append to Post</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 text-red-500">
            {error}
          </div>
        ) : post ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <AppendContentForm 
              postId={post.id} 
              subject={post.subject}
              existingImageCount={existingImageCount}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
} 