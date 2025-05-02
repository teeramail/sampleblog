"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import Image from "next/image";

const defaultThumbnailUrl = "https://via.placeholder.com/150x150?text=No+Image";

// Define Post type to match the actual database schema
type Post = {
  id: string;
  title: string;
  content: string;
  image_urls: string[] | null;
  created_at: Date | null;
  updated_at: Date | null;
  is_active: boolean;
  is_question: boolean;
  author_name: string | null;
};

// Define the response type from the API
interface PostPage {
  items: Post[];
  nextCursor: string | undefined;
};

export function PostList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const utils = api.useUtils();
  
  // Use search query if provided, otherwise use paginated getAll
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    error: searchError,
  } = api.post.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length > 0 }
  );
  
  interface PostPage {
    items: Post[];
    nextCursor: string | undefined;
  }

  const {
    data: postsData,
    isLoading: isPostsLoading,
    error: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.post.getAll.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: searchQuery.length === 0,
    }
  );
  
  const deleteMutation = api.post.delete.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh the data
      utils.post.getAll.invalidate();
      if (searchQuery) {
        utils.post.search.invalidate();
      }
      setIsDeletingId(null);
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
      setIsDeletingId(null);
    }
  });
  
  const handleDelete = (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      setIsDeletingId(postId);
      deleteMutation.mutate({ id: postId });
    }
  };
  
  const isLoading = isSearchLoading || isPostsLoading;
  const error = searchError ?? postsError;
  
  // Flatten paginated results
  const posts = searchQuery.length > 0
    ? (searchResults ?? [])
    : (postsData?.pages.flatMap(page => {
        // Map any fields that might be null to their expected types
        return page.items.map(item => ({
          ...item,
          // Convert to snake_case field names if needed
          created_at: item.created_at ? new Date(item.created_at) : null,
          updated_at: item.updated_at ? new Date(item.updated_at) : null
        }));
      }) ?? []);
  
  // Handle search input change
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Execute search when user submits
  const executeSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    
    try {
      // Force refetch of the search query
      await utils.post.search.invalidate();
      
      // The actual search is handled by the useQuery hook above
      // which will automatically run when searchQuery changes
    } catch (error) {
      console.error("Search error:", error);
    }
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };
  


  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Posts</h1>
      </div>
      
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            placeholder="Search by title..."
            className="w-full rounded-l-md border border-gray-300 p-2"
            value={searchQuery}
            onChange={handleSearchInput}
          />
          <button 
            type="submit" 
            className="rounded-r-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          Error loading posts: {error.message}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          {searchQuery ? "No posts found matching your search" : "No posts found"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Post
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Content
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Dates
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0">
                        <Image
                          src={typeof post.image_urls?.[0] === 'string' ? post.image_urls[0] : defaultThumbnailUrl}
                          alt={`${post.title} thumbnail`}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{post.title}</div>
                      <div className="text-sm text-gray-500">
                        {post.author_name ? `By: ${post.author_name}` : 'No author'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {post.image_urls?.length || 0} {post.image_urls?.length === 1 ? 'image' : 'images'}
                      </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs text-sm text-gray-900">
                      {truncateText(post.content, 100)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {post.author_name || 'No author'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      post.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {post.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="ml-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-blue-100 text-blue-800">
                      {post.is_question ? 'Question' : 'Post'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <div>Created: {formatDate(post.created_at)}</div>
                    <div>Updated: {formatDate(post.updated_at)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="mr-2 text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="mr-2 text-green-600 hover:text-green-900"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/posts/${post.id}/add`}
                      className="mr-2 text-indigo-600 hover:text-indigo-900"
                    >
                      Add
                    </Link>
                    <button
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeletingId === post.id}
                    >
                      {isDeletingId === post.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!searchQuery && hasNextPage && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading more..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
