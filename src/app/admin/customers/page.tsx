"use client";

import Link from "next/link";
import { CustomerList } from "~/app/_components/CustomerList";

export default function AdminCustomersPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Customer Management</h2>
        <Link 
          href="/admin/customers/new" 
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add Customer
        </Link>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <CustomerList />
      </div>
    </div>
  );
} 