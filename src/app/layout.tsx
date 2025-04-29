import "~/styles/globals.css";

import { Geist } from "next/font/google";
import Link from "next/link";

import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from 'react-hot-toast';

// Metadata is defined in metadata.ts

// Simple navigation component defined inline to avoid import issues
function Navigation() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Customer Management
          </Link>
          <nav className="ml-10">
            <ul className="flex space-x-4">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/customers" className="text-gray-600 hover:text-gray-900">
                  Customers
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                  Admin
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} style={{filter: "invert(0)"}}>
      <body className="min-h-screen bg-gray-50">
        <Navigation />
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
