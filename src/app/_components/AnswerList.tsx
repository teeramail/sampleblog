"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

type Answer = {
  id: string;
  postId: string;
  content: string;
  imageUrls: string[];
  authorName: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type AnswerListProps = {
  postId: string;
};

export function AnswerList({ postId }: AnswerListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const utils = api.useUtils();
  
  const { data: answers = [], isLoading, error } = 
    api.answer.getByPostId.useQuery({ postId });
  
  const deleteMutation = api.answer.delete.useMutation({
    onSuccess: () => {
      utils.answer.getByPostId.invalidate({ postId });
    },
    onSettled: () => {
      setIsDeleting(null);
    }
  });
  
  const handleDelete = (answerId: string) => {
    if (confirm('Are you sure you want to delete this answer?')) {
      setIsDeleting(answerId);
      deleteMutation.mutate({ id: answerId });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-500">
        Error loading answers: {error.message}
      </div>
    );
  }
  
  if (answers.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No answers yet. Be the first to respond!
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-200">
      {answers.map((answer) => (
        <div key={answer.id} className="py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="mr-2 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-800 font-medium">
                  {answer.authorName && answer.authorName.length > 0 
                    ? answer.authorName[0].toUpperCase() 
                    : 'A'}
                </span>
              </div>
              <div>
                <h3 className="font-medium">
                  {answer.authorName || 'Anonymous'}
                  {answer.isVerified && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                      Verified
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleDelete(answer.id)}
              disabled={isDeleting === answer.id}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              {isDeleting === answer.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
          
          <div className="mt-4 whitespace-pre-wrap">
            {answer.content}
          </div>
          
          {answer.imageUrls && answer.imageUrls.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {answer.imageUrls.map((url, index) => (
                <div key={index} className="relative h-32 w-32">
                  <Image
                    src={url}
                    alt={`Image ${index + 1}`}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 