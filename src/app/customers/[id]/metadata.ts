import { Metadata } from "next";

// Define dynamic metadata for the customer detail page
export const generateMetadata = async ({ params }: { params: { id: string } }): Promise<Metadata> => {
  return {
    title: "Customer Details | Customer Management",
    description: "View customer details",
  };
};
