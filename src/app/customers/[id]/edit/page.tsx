"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { CustomerEditWrapper } from "~/app/_components/CustomerEditWrapper";

// No need for params prop in client components when using useParams hook

export default function CustomerEditPage() {
  const params = useParams();
  
  // Use the useParams hook to safely access route parameters
  const customerId = params?.id ? String(params.id) : '';

  const { data: customer, isLoading } = api.customer.getById.useQuery(
    { id: customerId }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
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

      {customer && (
        <CustomerEditWrapper 
          customer={customer} 
          customerId={customerId} 
        />
      )}
    </main>
  );
}
