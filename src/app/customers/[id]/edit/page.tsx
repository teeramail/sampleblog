"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CustomerEditRedirectPage() {
  const router = useRouter();
  const params = useParams();
  
  const customerId = params?.id ? String(params.id) : '';
  
  useEffect(() => {
    router.replace(`/admin/customers/${customerId}/edit`);
  }, [router, customerId]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600">Redirecting to Edit Customer in Admin...</p>
        </div>
      </div>
    </main>
  );
}
