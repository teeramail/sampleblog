import Link from "next/link";

export default function AdminPage() {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Admin Sections</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AdminCard
          title="Customer Management"
          description="View, add, edit, and delete customer records"
          href="/admin/customers"
        />
        <AdminCard
          title="Posts"
          description="Manage content posts"
          href="/admin/posts"
        />
        {/* Add more admin sections as needed */}
      </div>
    </div>
  );
}

function AdminCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link 
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
    >
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
} 