"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewCustomerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/customers/new");
  }, [router]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600">Redirecting to Add New Customer in Admin...</p>
        </div>
      </div>
    </main>
  );
}
