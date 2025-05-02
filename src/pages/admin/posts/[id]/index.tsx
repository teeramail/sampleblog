"use client";

import React from "react";
import { useRouter } from "next/router";
import { api } from "~/trpc/react";
import Link from "next/link";
import Image from "next/image";

export default function ViewPostPage() {
  const router = useRouter();
  const { id } = router.query;
  
  // Fetch the post data
  const { data: post, isLoading, error } = api.post.getById.useQuery(
    { id: id as string },
    { enabled: !!id }
  );
  
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  
  // Show loading state while fetching post data
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading post data...</div>
        </div>
      </div>
    );
  }
  
  // Show error if post couldn't be loaded
  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">View Post</h1>
          <Link 
            href="/admin/posts"
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Back to Posts
          </Link>
        </div>
        
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          {error ? error.message : "Post not found"}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">View Post</h1>
        <div className="flex space-x-2">
          <Link 
            href={`/admin/posts/${post.id}/edit`}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Edit
          </Link>
          <Link 
            href={`/admin/posts/${post.id}/add`}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Add Content
          </Link>
          <Link 
            href="/admin/posts"
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Back to Posts
          </Link>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {post.title}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {post.is_question ? "Question" : "Post"} • {post.is_active ? "Active" : "Inactive"}
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Author
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {post.author_name || "No author"}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Created
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(post.created_at)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(post.updated_at)}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Content
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                {post.content}
              </dd>
            </div>
            {post.image_urls && post.image_urls.length > 0 && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Images
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {post.image_urls.map((url, index) => (
                      <div key={index} className="relative border rounded-md overflow-hidden h-40">
                        <Image
                          src={url}
                          alt={`Image ${index + 1}`}
                          width={150}
                          height={150}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                        {index === 0 && (
                          <div className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs">
                            Thumbnail
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
