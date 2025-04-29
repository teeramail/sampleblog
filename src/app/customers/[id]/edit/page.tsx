import { redirect } from "next/navigation";
import { CustomerEditWrapper } from "~/app/_components/CustomerEditWrapper";
import { api } from "~/trpc/server";

export interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function CustomerEditPage({ params }: PageProps) {
  const customerId = params.id;
  
  try {
    // Fetch customer data from server using the server API
    const customer = await api.customer.getById.query({
      id: customerId
    });
    
    if (!customer) {
      redirect('/customers');
    }
    
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Customer</h1>
        </div>
        
        <CustomerEditWrapper customer={customer} customerId={customerId} />
      </main>
    );
  } catch (error) {
    redirect('/customers');
  }
}
