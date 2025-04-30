import { api } from "~/trpc/server";
import { notFound } from "next/navigation";
import { AppendContentForm } from "~/app/_components/AppendContentForm";

interface AppendContentPageProps {
  params: {
    id: string;
  };
}

export default async function AppendContentPage({ params }: AppendContentPageProps) {
  // Properly extract ID from params in an async component
  const id = params.id;
  
  // Fetch post details
  let post;
  try {
    post = await api.post.getById({ id });
  } catch (error) {
    return notFound();
  }
  
  // Get the existing image count
  const existingImageCount = Array.isArray(post.imageUrls) ? post.imageUrls.length : 0;
  
  return (
    <main className="container mx-auto p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold">Append to Post</h1>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <AppendContentForm 
            postId={post.id} 
            subject={post.subject}
            existingImageCount={existingImageCount}
          />
        </div>
      </div>
    </main>
  );
} 