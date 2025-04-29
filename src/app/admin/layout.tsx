import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Real Estate CRM",
  description: "Admin dashboard for Real Estate CRM",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>
        {children}
      </div>
    </div>
  );
} 