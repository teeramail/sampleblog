"use client";

import React from 'react';
import { FollowUpQuestionForm } from '../../../app/components/FollowUpQuestionForm';
import { useRouter } from 'next/navigation';

interface FollowUpQuestionWrapperProps {
  postId: string;
}

export function FollowUpQuestionWrapper({ postId }: FollowUpQuestionWrapperProps) {
  const router = useRouter();

  const handleQuestionAdded = () => {
    // Refresh the page after adding a question
    router.refresh();
  };

  return <FollowUpQuestionForm postId={postId} onQuestionAdded={handleQuestionAdded} />;
} 