import { type Metadata } from "next";

// Define dynamic metadata for the customer detail page
export const generateMetadata = async ({ params }: { params: { id: string } }): Promise<Metadata> => {
  return {
    title: `Customer ${params.id} - Details`,
    description: `View and edit details for customer ${params.id}`,
  };
};
