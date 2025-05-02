import { useRouter } from "next/router";
import Link from "next/link";
import { Container } from "~/components/ui/Container";
import { Card } from "~/components/ui/Card";

export default function AdminDashboard() {
  const router = useRouter();

  const adminMenuItems = [
    {
      title: "Posts",
      description: "Manage blog posts and questions",
      href: "/admin/posts",
      icon: "📝",
    },
    {
      title: "Forum",
      description: "Manage forum topics and posts",
      href: "/forum",
      icon: "💬",
    },
    {
      title: "Customers",
      description: "Manage customer profiles",
      href: "/admin/customers",
      icon: "👥",
    },
  ];

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminMenuItems.map((item) => (
            <Link key={item.title} href={item.href} className="block">
              <Card className="p-6 h-full hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="text-4xl mr-4">{item.icon}</div>
                  <div>
                    <h2 className="text-xl font-semibold">{item.title}</h2>
                    <p className="text-gray-600 mt-2">{item.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Container>
  );
}
