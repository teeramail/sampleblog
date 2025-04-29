"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteConfirmation } from "~/app/_components/DeleteConfirmation";
import type { Customer } from "~/types";

interface CustomerDetailWrapperProps {
  customer: Customer;
}

export function CustomerDetailWrapper({ customer }: CustomerDetailWrapperProps) {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsDeleteModalOpen(true)}
        className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Delete
      </button>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        customerId={customer.id}
        customerName={customer.name}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </>
  );
}
