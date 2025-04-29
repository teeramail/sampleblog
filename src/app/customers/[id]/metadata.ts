import type { Metadata } from "next";

// Define dynamic metadata for the customer detail page
export async function generateMetadata({ params: _params }: { params: { id: string } }) {
  return {
    title: "Customer Details | Customer Management",
    description: "View customer details",
  };
}
