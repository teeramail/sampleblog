import React, { useState } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { Button, Card, Container, Pagination, Spinner } from "~/components/ui";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const TOPICS_PER_PAGE = 10;

export const TopicList: React.FC = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch topics with pagination
  const { data, isLoading, error } = api.topic.getAll.useQuery({
    limit: TOPICS_PER_PAGE,
    offset: (currentPage - 1) * TOPICS_PER_PAGE,
  });

  const handleCreateTopic = () => {
    router.push("/forum/new-topic");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <Container className="py-8 text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading topics...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <h3 className="text-lg font-medium">Error loading topics</h3>
          <p className="mt-2">{error.message}</p>
        </div>
      </Container>
    );
  }

  const { topics, totalCount } = data || { topics: [], totalCount: 0 };
  const totalPages = Math.ceil(totalCount / TOPICS_PER_PAGE);

  return (
    <Container className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Forum Topics</h1>
        <Button onClick={handleCreateTopic} variant="primary">
          Create New Topic
        </Button>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">No topics yet</h3>
          <p className="mt-2 text-gray-600">
            Be the first to create a topic in this forum!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {topics.map((topic) => (
              <Link 
                key={topic.id} 
                href={`/forum/topics/${topic.id}`}
                className="block"
              >
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-start gap-4">
                    {topic.thumbnailUrl && (
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                        <img
                          src={topic.thumbnailUrl}
                          alt={topic.subject}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {topic.subject}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>Started by {topic.authorName}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {formatDistanceToNow(new Date(topic.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {topic.postCount} {topic.postCount === 1 ? "post" : "posts"}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>
                        Last updated{" "}
                        {formatDistanceToNow(new Date(topic.updatedAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default TopicList;
