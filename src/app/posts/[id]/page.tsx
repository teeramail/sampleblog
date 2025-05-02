import React from 'react';
import { notFound } from 'next/navigation';
import { api } from "~/trpc/server";
import { QACard } from "~/app/components/QACard";
import Image from "next/image";
import { AnswerFormWrapper } from './AnswerFormWrapper';
import { FollowUpQuestionWrapper } from './FollowUpQuestionWrapper';
import type { Answer } from '../../../server/db/types';

// Define ContentSection type inline to avoid import issues
interface ContentSection {
  id: string;
  content: string;
  createdAt: Date;
  imageUrls: string[];
}

// Format date for display
function formatDate(date: Date | null): string {
  if (!date) return 'Unknown date';
  return new Date(date).toLocaleDateString();
}

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  
  if (!id) {
    return notFound();
  }

  try {
    // Fetch post data
    const post = await api.post.getById({ id });
    
    if (!post) {
      return notFound();
    }
    
    // Fetch content sections
    let contentSections: ContentSection[] = [];
    try {
      contentSections = await api.post.getContentSections({ postId: id });
    } catch (error) {
      console.error('Error fetching content sections:', error);
      // Continue without content sections if there's an error
    }
    
    // Fetch answers
    let answers: Answer[] = [];
    try {
      const answerData = await api.post.getAnswers({ postId: id });
      answers = answerData.map((answer: any) => ({
        id: answer.id,
        content: answer.content,
        imageUrls: answer.image_urls || [],
        authorName: answer.author_name || null,
        createdAt: answer.created_at || new Date(),
        isVerified: answer.is_verified || false
      }));
    } catch (error) {
      console.error('Error fetching answers:', error);
      // Continue without answers if there's an error
    }
    
    // Fetch related posts
    let relatedPosts: any[] = [];
    try {
      relatedPosts = await api.post.getRelated({ id });
    } catch (error) {
      console.error('Error fetching related posts:', error);
      // Continue without related posts if there's an error
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          <p className="text-gray-600">
            Posted by {post.author_name || 'Anonymous'} • {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="mb-8">
          <QACard
            content={post.content || ""}
            imageUrls={post.image_urls || []}
            authorName={post.author_name}
            createdAt={post.created_at}
            isVerified={post.is_verified}
            isQuestion={true}
            contentSections={contentSections}
          />
        </div>

        <section className="mb-8">
          {/* Answers Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Answers</h2>
            
            {answers.length > 0 ? (
              <div className="space-y-6">
                {answers.map((answer) => (
                  <QACard
                    key={answer.id}
                    content={answer.content}
                    imageUrls={answer.image_urls || []}
                    authorName={answer.author_name}
                    createdAt={answer.created_at || new Date()}
                    isVerified={answer.is_verified}
                    isQuestion={false}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No answers yet. Be the first to answer!</p>
            )}
            
            <div className="mt-6">
              <AnswerFormWrapper postId={id} />
            </div>
          </div>
          
          {/* Follow-up Questions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Ask a Follow-up Question</h2>
            <FollowUpQuestionWrapper postId={id} />
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error('Error fetching post data:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          Error: Unable to load post details. Please try again later.
        </div>
      </div>
    );
  }
}