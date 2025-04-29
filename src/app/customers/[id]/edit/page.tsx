"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { CustomerEditForm } from "~/app/_components/CustomerEditForm";

interface CustomerEditPageProps {
  params: {
    id: string;
  };
}

export default function CustomerEditPage({ params }: CustomerEditPageProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the customer ID directly from params
  const customerId = params.id;

  const { data: customer, isLoading } = api.customer.getById.useQuery(
    { id: customerId }
  );

  const updateCustomer = api.customer.update.useMutation({
    onSuccess: () => {
      router.push(`/customers/${customerId}`);
      router.refresh();
    },
    onError: (err) => {
      setError(err.message || "Failed to update customer. Please try again.");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: {
    name: string;
    email: string;
    phone?: string;
    thumbnailUrl?: string;
    imageUrls?: string[];
  }) => {
    setIsSubmitting(true);
    setError(null);

    updateCustomer.mutate({
      id: customerId,
      ...data,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-yellow-50 p-4 text-yellow-700">
          Customer not found
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Customer</h1>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-red-500">
          {error}
        </div>
      )}

      <CustomerEditForm
        customer={customer}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        customerId={customerId}
      />
    </main>
  );
}
