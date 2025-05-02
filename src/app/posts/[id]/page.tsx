import React from 'react';
import { notFound } from 'next/navigation';
import { api } from "~/trpc/server";
import { QACard } from "~/app/components/QACard";
import Image from "next/image";
import { AnswerFormWrapper } from './AnswerFormWrapper';
import { FollowUpQuestionWrapper } from './FollowUpQuestionWrapper';
import type { Metadata } from 'next';

// Define types for our data structures
type ContentSection = {
  id: string;
  content: string;
  createdAt: Date;
  imageUrls: string[];
};

type AnswerDisplay = {
  id: string;
  content: string;
  imageUrls: string[];
  authorName: string | null;
  createdAt: Date;
  isVerified: boolean;
};

type Post = {
  id: string;
  title: string;
  content: string;
  image_urls: string[] | null;
  created_at: Date;
  updated_at: Date | null;
  is_active: boolean;
  is_question: boolean;
  author_name: string | null;
};

// Format date for display with null safety
function formatDate(date: Date | null | undefined): string {
  if (!date) return 'Unknown date';
  return new Date(date).toLocaleDateString();
}

// Define page props according to Next.js 15 conventions
type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Generate metadata for the page
export async function generateMetadata({ 
  params 
}: Props): Promise<Metadata> {
  // Safely fetch post data for metadata
  try {
    const id = params.id;
    const post = await api.post.getById({ id });
    
    if (!post) {
      return {
        title: 'Post not found',
        description: 'The requested post could not be found',
      };
    }
    
    return {
      title: post.title || `Post ${id}`,
      description: post.content?.substring(0, 160) || 'Post detail page',
    };
  } catch (error) {
    return {
      title: 'Post',
      description: 'Post detail page',
    };
  }
}

// Main page component
export default async function PostDetailPage({ 
  params,
  searchParams 
}: Props) {
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
    
    // Safely cast the post to our type
    const typedPost = post as unknown as Post;
    
    // Initialize empty arrays for our data
    let contentSections: ContentSection[] = [];
    let answers: AnswerDisplay[] = [];
    let relatedPosts: Post[] = [];
    
    // Try to fetch content sections if the API supports it
    try {
      // @ts-ignore - API method might not exist in type definitions
      const sectionsData = await api.post.getContentSections?.({ postId: id });
      if (sectionsData && Array.isArray(sectionsData)) {
        contentSections = sectionsData.map(section => ({
          id: section.id || '',
          content: section.content || '',
          createdAt: section.createdAt ? new Date(section.createdAt) : new Date(),
          imageUrls: Array.isArray(section.imageUrls) ? section.imageUrls : []
        }));
      }
    } catch (error) {
      console.error('Content sections not available:', error);
    }
    
    // Try to fetch answers if the API supports it
    try {
      // @ts-ignore - API method might not exist in type definitions
      const answerData = await api.post.getAnswers?.({ postId: id });
      if (answerData && Array.isArray(answerData)) {
        answers = answerData.map(answer => ({
          id: answer.id || '',
          content: answer.content || '',
          imageUrls: Array.isArray(answer.image_urls) ? answer.image_urls : [],
          authorName: answer.author_name || null,
          createdAt: answer.created_at ? new Date(answer.created_at) : new Date(),
          isVerified: Boolean(answer.is_verified)
        }));
      }
    } catch (error) {
      console.error('Answers not available:', error);
    }
    
    // Try to fetch related posts if the API supports it
    try {
      // @ts-ignore - API method might not exist in type definitions
      const relatedData = await api.post.getRelated?.({ id });
      if (relatedData && Array.isArray(relatedData)) {
        relatedPosts = relatedData as unknown as Post[];
      }
    } catch (error) {
      console.error('Related posts not available:', error);
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2">{typedPost.title}</h1>
          <p className="text-gray-600">
            Posted by {typedPost.author_name || 'Anonymous'} • {formatDate(typedPost.created_at)}
          </p>
        </div>

        <div className="mb-8">
          <QACard
            content={typedPost.content || ""}
            imageUrls={typedPost.image_urls || []}
            authorName={typedPost.author_name}
            createdAt={typedPost.created_at || new Date()}
            isVerified={false} /* Default to false as this field doesn't exist in the post type */
            isQuestion={typedPost.is_question}
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

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <div
                  key={relatedPost.id}
                  className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">
                      <a
                        href={`/posts/${relatedPost.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {relatedPost.title}
                      </a>
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {formatDate(relatedPost.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in PostDetailPage:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          Error loading post details. Please try again later.
        </div>
      </div>
    );
  }
}