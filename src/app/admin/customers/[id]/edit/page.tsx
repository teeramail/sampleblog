"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { CustomerEditWrapper } from "~/app/_components/CustomerEditWrapper";
import Link from "next/link";

export default function AdminCustomerEditPage() {
  const params = useParams();
  
  // Use the useParams hook to safely access route parameters
  const customerId = params?.id ? String(params.id) : '';

  const { data: customer, isLoading } = api.customer.getById.useQuery(
    { id: customerId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 text-yellow-700">
        Customer not found
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Edit Customer: {customer.name}</h2>
        <Link
          href={`/admin/customers/${customerId}`}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {customer && (
          <CustomerEditWrapper 
            customer={customer} 
            customerId={customerId}
            redirectTo={`/admin/customers/${customerId}`} 
          />
        )}
      </div>
    </div>
  );
} 