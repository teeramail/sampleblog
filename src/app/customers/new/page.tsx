"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { CustomerEditForm } from "~/app/_components/CustomerEditForm";

export default function NewCustomerPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Empty customer template for new customer form
  const emptyCustomer = {
    id: "",
    name: "",
    email: "",
    phone: null,
    thumbnailUrl: null,
    imageUrls: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createCustomer = api.customer.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        router.push(`/customers/${data.id}`);
        router.refresh();
      } else {
        router.push('/customers');
      }
    },
    onError: (err) => {
      setError(`Error creating customer: ${err.message}`);
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

    createCustomer.mutate(data);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Customer</h1>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-red-500">
          {error}
        </div>
      )}

      <CustomerEditForm
        customer={emptyCustomer}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
