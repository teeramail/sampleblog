"use client";

import Link from "next/link";
import { PostForm } from "~/app/_components/PostForm";

export default function NewPostPage() {
  return (
    <div>
      <div className="mb-6 flex items-center">
        <Link 
          href="/admin/posts" 
          className="mr-4 text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Posts
        </Link>
        <h2 className="text-2xl font-semibold">Create New Post</h2>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <PostForm />
      </div>
    </div>
  );
} 