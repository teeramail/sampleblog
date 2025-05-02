import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Container } from "~/components/ui/Container";
import { PostList } from "~/components/admin/PostList";
import Link from "next/link";

// Define types for posts
type Post = {
  id: string;
  subject: string;
  content: string;
  thumbnailUrl: string;
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isQuestion: boolean;
  authorName?: string;
};

export default function AdminPostsPage() {
  const router = useRouter();

  return (
    <Container>
      <div className="py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Posts</h1>
          <Link 
            href="/admin/posts/new"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create New Post
          </Link>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin: Manage Posts</h1>
          <button 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 px-4 h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => router.push("/admin/posts/new")}
          >
            Create New Post
          </button>
        </div>
        
        <PostList />
      </div>
    </Container>
  );
}
