# Posts Management Feature

## Overview

The Posts Management feature is a complete CRUD system for managing blog posts in the admin dashboard. It allows administrators to create, read, update, and delete posts, with support for thumbnails, image galleries, and categorization by subject.

## Database Schema

The feature extends the database with a new `posts` table containing the following fields:

- `id`: Unique identifier for each post
- `subject`: The post's title or subject
- `content`: The main content of the post
- `thumbnailUrl`: URL to the post's thumbnail image
- `imageUrls`: Array of URLs to gallery images
- `isActive`: Boolean indicating whether the post is active
- `createdAt`: Timestamp when the post was created
- `updatedAt`: Timestamp when the post was last updated

## API Endpoints

The feature exposes the following API endpoints through the tRPC router:

- `post.create`: Create a new post
- `post.getAll`: Get a paginated list of posts
- `post.getById`: Get a specific post by ID
- `post.update`: Update an existing post
- `post.delete`: Delete a post
- `post.search`: Search posts by subject
- `post.getSubjects`: Get a list of unique subjects for dropdown selection

## User Interface Components

### 1. Posts List Page
- Displays all posts in a table with search and pagination
- Shows thumbnail, subject, content preview, status, and dates
- Provides links to view, edit, or delete each post

### 2. Create Post Form
- Form for creating new posts with fields for subject, content, and status
- Subject field includes dropdown for existing subjects or option to create new ones
- Upload functionality for thumbnail and multiple gallery images

### 3. Edit Post Form
- Similar to the create form but pre-populated with post data
- Allows updating all fields including images

### 4. View Post Page
- Detailed view of a post showing all information
- Displays thumbnail and gallery images
- Includes buttons for editing and deleting the post

## Usage

### Creating a Post
1. Navigate to Admin > Posts
2. Click "Add Post"
3. Fill in the required fields (subject and content)
4. Optionally upload a thumbnail and gallery images
5. Set the post status (active/inactive)
6. Click "Create Post"

### Editing a Post
1. Navigate to Admin > Posts
2. Find the post you want to edit and click "Edit"
3. Update the fields as needed
4. Click "Update Post"

### Deleting a Post
1. Navigate to Admin > Posts
2. Find the post you want to delete
3. Click "Delete" and confirm the deletion

## Technical Notes

- Image uploads are handled through a mock implementation that can be easily replaced with real S3 integration
- The feature supports up to 20 gallery images per post
- Subjects are dynamically managed - they can be selected from existing ones or created new

## Future Enhancements

Potential future improvements include:
- Real S3 integration for image uploads
- Image optimization for better performance
- Rich text editor for post content
- Image reordering for gallery images 