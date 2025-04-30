"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "~/trpc/react";

const defaultThumbnailUrl = "https://via.placeholder.com/150x150?text=No+Image";

export default function ViewPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: post, isLoading, error } = 
    api.post.getById.useQuery({ id: postId });
  
  const deleteMutation = api.post.delete.useMutation({
    onSuccess: () => {
      router.push('/admin/posts');
    }
  });
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true);
      deleteMutation.mutate({ id: postId });
    }
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/admin/posts" 
            className="mr-4 text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Posts
          </Link>
          <h2 className="text-2xl font-semibold">Post Details</h2>
        </div>
        
        {post && (
          <div className="flex gap-2">
            <Link
              href={`/admin/posts/${postId}/edit`}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 text-red-500">
            Error loading post: {error.message}
          </div>
        ) : !post ? (
          <div className="py-8 text-center text-gray-500">
            Post not found
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between">
              <h1 className="text-3xl font-bold">{post.subject}</h1>
              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                post.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {post.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="text-sm text-gray-500">
              <div>Created: {formatDate(post.createdAt)}</div>
              <div>Updated: {formatDate(post.updatedAt)}</div>
            </div>
            
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-lg font-medium">Thumbnail</h3>
              <Image
                src={post.thumbnailUrl ?? defaultThumbnailUrl}
                alt={`${post.subject} thumbnail`}
                width={200}
                height={200}
                className="rounded-md object-cover"
              />
            </div>
            
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-lg font-medium">Content</h3>
              <div className="prose max-w-none whitespace-pre-wrap">
                {post.content}
              </div>
            </div>
            
            {post.imageUrls.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 text-lg font-medium">
                  Gallery Images ({post.imageUrls.length})
                </h3>
                <div className="mt-2 flex flex-wrap gap-4">
                  {post.imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={url}
                        alt={`Gallery image ${index + 1}`}
                        width={150}
                        height={150}
                        className="rounded-md object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 