"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { CustomerEditForm } from "~/app/_components/CustomerEditForm";
import type { Customer } from "~/types";

interface CustomerEditWrapperProps {
  customer: Customer;
  customerId: string;
}

export function CustomerEditWrapper({ customer, customerId }: CustomerEditWrapperProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <>
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
    </>
  );
}
