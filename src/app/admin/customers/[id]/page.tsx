"use client";

import { useState } from "react";
import { notFound, useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import { DeleteConfirmation } from "~/app/_components/DeleteConfirmation";

export default function AdminCustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Use the useParams hook to safely access route parameters
  const customerId = params?.id ? String(params.id) : '';
  
  // Fetch customer data
  const { data: customer, error } = api.customer.getById.useQuery(
    { id: customerId }
  );
  
  // Handle error by redirecting
  if (error) {
    router.push("/admin/customers");
  }
  
  if (error) {
    return notFound();
  }
  
  if (!customer) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  // Format dates for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Customer Details: {customer?.name ?? "Unknown"}
        </h2>
        <div className="flex gap-2">
          <Link
            href={`/admin/customers/${customer.id}/edit`}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Edit
          </Link>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Delete
          </button>
          <Link
            href="/admin/customers"
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Back to List
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center">
            <div className="mr-4 h-24 w-24 flex-shrink-0">
              {customer.thumbnailUrl ? (
                <Image
                  src={customer.thumbnailUrl}
                  alt={customer.name}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-2xl text-gray-500">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{customer.name}</h3>
              <p className="text-sm text-gray-500">Customer ID: {customer.id}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                  {customer.email}
                </a>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {customer.phone ?? "—"}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {formatDate(customer.createdAt)}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {formatDate(customer.updatedAt)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Images</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {customer.imageUrls && customer.imageUrls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {customer.imageUrls.map((imageUrl: string, index: number) => (
                      <div key={index} className="relative h-32 w-full overflow-hidden rounded-lg">
                        <Image
                          src={imageUrl}
                          alt={`Customer image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No images available</p>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        customerId={customer.id}
        customerName={customer.name}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        redirectTo="/admin/customers"
      />
    </div>
  );
} 