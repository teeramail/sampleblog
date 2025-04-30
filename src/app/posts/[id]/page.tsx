import React from 'react';
import { notFound } from 'next/navigation';
import { api } from '~/trpc/server';
import { QACard } from '../../../app/components/QACard';
import { AnswerFormWrapper } from './AnswerFormWrapper';
import { FollowUpQuestionWrapper } from './FollowUpQuestionWrapper';
import type { Answer } from '../../../server/db/types';

interface ViewPostPageProps {
  params: {
    id: string;
  };
}

export default async function PostDetailPage({ params }: ViewPostPageProps) {
  if (!params.id) {
    return notFound();
  }

  try {
    const post = await api.post.getById({ id: params.id });
    
    if (!post) {
      return notFound();
    }
    
    const answers = await api.answer.getByPostId({ postId: params.id });

    return (
      <div className="container mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">{post.subject}</h1>
          <div className="mt-2 text-sm text-gray-500">
            Posted {post.createdAt.toLocaleDateString()}
            {post.authorName && <span> by {post.authorName}</span>}
          </div>
        </header>

        <div className="mb-8">
          <QACard
            content={post.content}
            imageUrls={post.imageUrls}
            authorName={post.authorName}
            createdAt={post.createdAt}
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
                  createdAt={answer.createdAt}
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
          <AnswerFormWrapper postId={params.id} />
        </section>

        <section>
          <FollowUpQuestionWrapper postId={params.id} />
        </section>
      </div>
    );
  } catch (error) {
    console.error("Error fetching post details:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          Error: Unable to load post details. Please try again later.
        </div>
      </div>
    );
  }
} 