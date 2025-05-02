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
          <h1 className="text-2xl font-bold">Admin: Manage Posts</h1>
          <Link 
            href="/admin/posts/new"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create New Post
          </Link>
        </div>
        
        <PostList />
      </div>
    </Container>
  );
}
