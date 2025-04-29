// Type definitions for the application

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
