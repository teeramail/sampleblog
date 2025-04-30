"use client";

import Link from "next/link";
import { PostList } from "~/app/_components/PostList";

export default function AdminPostsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Post Management</h2>
        <Link 
          href="/admin/posts/new" 
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Post
        </Link>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <PostList />
      </div>
    </div>
  );
} 