import React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

// Types for props
interface ContentWithImagesProps {
  content: string;
  imageUrls?: string[] | null;
  authorName?: string | null;
  createdAt: Date;
  isVerified?: boolean;
  isQuestion?: boolean;
}

export function QACard({
  content,
  imageUrls,
  authorName,
  createdAt,
  isVerified = false,
  isQuestion = true,
}: ContentWithImagesProps) {
  return (
    <div className="space-y-4">
      {/* Text Content Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="flex flex-row items-center gap-4 pb-4">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
            {authorName ? authorName.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{authorName || 'Anonymous'}</h3>
              {isVerified && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                  Verified
                </span>
              )}
              {isQuestion && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  Question
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="prose max-w-none">
          {content.split('\n').map((paragraph, i) => (
            <p key={i} className="mb-2">{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Images Card - Only shown if there are images */}
      {imageUrls && imageUrls.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h4 className="text-sm text-gray-500 mb-4">
            {isQuestion ? 'Question' : 'Answer'} Images
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative aspect-square overflow-hidden rounded-md">
                <Image
                  src={url}
                  alt={`${isQuestion ? 'Question' : 'Answer'} image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 