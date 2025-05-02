"use client";

import React, { useState, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { api } from '~/trpc/react';
import { QACard } from '../../../app/components/QACard';
import { AnswerFormWrapper } from './AnswerFormWrapper';
import { FollowUpQuestionWrapper } from './FollowUpQuestionWrapper';
import type { Answer } from '../../../server/db/types';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;

  if (!postId) {
    return notFound();
  }

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { data: post, isLoading: isPostLoading, error: postError } = 
    api.post.getById.useQuery({ id: postId });
    
  const { data: answers = [], isLoading: isAnswersLoading } = 
    api.answer.getByPostId.useQuery({ postId });
  
  useEffect(() => {
    if (!isPostLoading && !isAnswersLoading) {
      setIsLoading(false);
      if (postError) {
        setError("Error loading post details");
      }
    }
  }, [isPostLoading, isAnswersLoading, postError]);
  
  // Redirect to 404 if post not found and not loading
  if (!isLoading && !post) {
    router.push('/404');
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          Error: Unable to load post details. Please try again later.
        </div>
      </div>
    );
  }
  
  if (!post) {
    return null; // This shouldn't happen due to the redirect, but TypeScript needs it
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <div className="mt-2 text-sm text-gray-500">
          Posted {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown date'}
          {post.author_name && <span> by {post.author_name}</span>}
        </div>
      </header>

      <div className="mb-8">
        <QACard
          content={post.content}
          imageUrls={post.image_urls}
          authorName={post.author_name}
          createdAt={post.created_at || new Date()}
          isQuestion={true}
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        {answers.length > 0 ? (
          <div className="space-y-6">
            {answers.map((answer: Answer) => (
              <QACard
                key={answer.id}
                content={answer.content}
                imageUrls={answer.imageUrls}
                authorName={answer.authorName}
                createdAt={answer.createdAt || new Date()}
                isVerified={answer.isVerified}
                isQuestion={false}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No answers yet. Be the first to answer!</p>
        )}
      </section>

      <section className="mb-8">
        <AnswerFormWrapper postId={postId} />
      </section>

      <section>
        <FollowUpQuestionWrapper postId={postId} />
      </section>
    </div>
  );
} 