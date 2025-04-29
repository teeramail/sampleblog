"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/customers");
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto flex h-full items-center justify-center px-4 py-16">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600">Redirecting to Customer Management in Admin...</p>
        </div>
      </div>
    </main>
  );
}

// Metadata moved to a separate file
