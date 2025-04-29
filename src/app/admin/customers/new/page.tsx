"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { CustomerEditForm } from "~/app/_components/CustomerEditForm";
import Link from "next/link";

export default function AdminNewCustomerPage() {
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
        router.push(`/admin/customers/${data.id}`);
        router.refresh();
      } else {
        router.push('/admin/customers');
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Add New Customer</h2>
        <Link 
          href="/admin/customers"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-red-500">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <CustomerEditForm
          customer={emptyCustomer}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
} 