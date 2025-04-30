"use client";

import React from 'react';
import { AnswerForm } from '../../../app/components/AnswerForm';
import { useRouter } from 'next/navigation';

interface AnswerFormWrapperProps {
  postId: string;
}

export function AnswerFormWrapper({ postId }: AnswerFormWrapperProps) {
  const router = useRouter();

  const handleAnswerAdded = () => {
    // Refresh the page to show the new answer
    router.refresh();
  };

  return <AnswerForm postId={postId} onAnswerAdded={handleAnswerAdded} />;
} 