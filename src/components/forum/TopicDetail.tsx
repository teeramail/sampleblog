import React, { useState } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { Button, Card, Container, Spinner } from "~/components/ui";
import { formatDistanceToNow } from "date-fns";
import { AddPostForm } from "./AddPostForm";

interface TopicDetailProps {
  topicId: string;
}

export const TopicDetail: React.FC<TopicDetailProps> = ({ topicId }) => {
  const router = useRouter();
  const [showAddPostForm, setShowAddPostForm] = useState(false);
  
  // Fetch topic details
  const { data, isLoading, error, refetch } = api.topic.getById.useQuery({
    id: topicId,
  });

  const handleBackToList = () => {
    router.push("/forum");
  };

  const handleAddPostClick = () => {
    setShowAddPostForm(true);
  };

  const handlePostAdded = () => {
    setShowAddPostForm(false);
    void refetch();
  };

  if (isLoading) {
    return (
      <Container className="py-8 text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading topic...</p>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container className="py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <h3 className="text-lg font-medium">Error loading topic</h3>
          <p className="mt-2">{error?.message || "Topic not found"}</p>
          <Button onClick={handleBackToList} variant="outline" className="mt-4">
            Back to Topics
          </Button>
        </div>
      </Container>
    );
  }

  const { topic, posts } = data;

  return (
    <Container className="py-8">
      <div className="mb-6">
        <Button onClick={handleBackToList} variant="outline" className="mb-4">
          ← Back to Topics
        </Button>
        <div className="flex items-start gap-6">
          {topic.thumbnailUrl && (
            <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-md">
              <img
                src={topic.thumbnailUrl}
                alt={topic.subject}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{topic.subject}</h1>
            <div className="mt-2 text-sm text-gray-600">
              Started by {posts[0]?.authorName} • {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {posts.map((post, index) => (
          <Card key={post.id} className={index === 0 ? "border-2 border-blue-200" : ""}>
            <div className="mb-4 flex items-center justify-between">
              <div className="font-medium text-gray-900">{post.authorName}</div>
              <div className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </div>
            </div>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
            {post.imageUrls && post.imageUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {post.imageUrls.map((imageUrl, imgIndex) => (
                  <div key={imgIndex} className="aspect-square overflow-hidden rounded-md">
                    <img
                      src={imageUrl}
                      alt={`Image ${imgIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {!showAddPostForm ? (
        <div className="mt-8 text-center">
          <Button onClick={handleAddPostClick} variant="primary" size="lg">
            Add Your Post
          </Button>
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Add Your Post</h2>
          <AddPostForm 
            topicId={topicId} 
            onPostAdded={handlePostAdded} 
            onCancel={() => setShowAddPostForm(false)}
          />
        </div>
      )}
    </Container>
  );
};

export default TopicDetail;
