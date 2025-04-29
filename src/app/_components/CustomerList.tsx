"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import Image from "next/image";

const defaultAvatarUrl = "/default-avatar.png";

// Define Customer type directly until shared types are properly set up
type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  thumbnailUrl: string | null;
  imageUrls: string[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export function CustomerList() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use search query if provided, otherwise use paginated getAll
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    error: searchError,
  } = api.customer.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length > 0 }
  );
  
  const {
    data: customerData,
    isLoading: isCustomersLoading,
    error: customersError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.customer.getAll.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: searchQuery.length === 0,
    }
  );
  
  const isLoading = isSearchLoading || isCustomersLoading;
  const error = searchError ?? customersError;
  
  // Flatten paginated results
  const customers = searchQuery.length > 0
    ? (searchResults ?? [])
    : (customerData?.pages.flatMap((page) => page.items) ?? []);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
      </div>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full rounded-md border border-gray-300 p-2"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4 text-red-500">
          Error loading customers: {error.message}
        </div>
      ) : customers.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          {searchQuery ? "No customers found matching your search" : "No customers found"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Dates
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {customers.map((customer: Customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {customer.thumbnailUrl ? (
                          <Image
                            src={customer.thumbnailUrl ?? defaultAvatarUrl}
                            alt={`${customer.name}'s thumbnail`}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                            {customer.name?.charAt(0).toUpperCase() ?? "U"}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{customer.name ?? "Unknown"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone ?? "—"}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <div>Created: {formatDate(customer.createdAt)}</div>
                    <div>Updated: {formatDate(customer.updatedAt)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="mr-2 text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                    <Link
                      href={`/customers/${customer.id}/edit`}
                      className="mr-2 text-green-600 hover:text-green-900"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!searchQuery && hasNextPage && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading more..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
