/**
 * Type definitions for database models
 */

export interface Post {
  id: string;
  subject: string;
  content: string;
  thumbnailUrl: string;
  imageUrls?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isQuestion: boolean;
  authorName?: string | null;
}

export interface Answer {
  id: string;
  postId: string;
  content: string;
  imageUrls?: string[] | null;
  authorName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  thumbnailUrl?: string | null;
  imageUrls?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
} 