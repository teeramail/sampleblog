"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

interface DeleteConfirmationProps {
  customerId: string;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export function DeleteConfirmation({
  customerId,
  customerName,
  isOpen,
  onClose,
  redirectTo = "/customers",
}: DeleteConfirmationProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteCustomer = api.customer.delete.useMutation({
    onSuccess: () => {
      router.push(redirectTo);
      router.refresh();
    },
    onError: (err) => {
      setError(`Error deleting customer: ${err.message}`);
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    setIsDeleting(true);
    setError(null);
    deleteCustomer.mutate({ id: customerId });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Confirm Deletion</h2>
        
        <p className="mb-4 text-gray-700">
          Are you sure you want to delete <strong>{customerName}</strong>? This action cannot be undone.
        </p>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
