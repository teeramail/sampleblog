import React from "react";
import Link from "next/link";
import { Container } from "../ui/Container";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                Real Estate Forum
              </Link>
              <nav className="ml-10 hidden space-x-8 md:flex">
                <Link
                  href="/forum"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Forum
                </Link>
                <Link
                  href="/customers"
                  className="text-gray-700 hover:text-blue-600"
                >
                  Customers
                </Link>
                <Link
                  href="/about"
                  className="text-gray-700 hover:text-blue-600"
                >
                  About
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              {/* Placeholder for user menu/auth */}
              <div className="rounded-full bg-gray-200 p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Container>
      </header>
      
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
      
      <footer className="border-t border-gray-200 bg-white py-8">
        <Container>
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 md:mb-0">
              <span className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Real Estate Forum. All rights reserved.
              </span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-blue-600">
                Terms
              </a>
              <a href="#" className="text-gray-500 hover:text-blue-600">
                Privacy
              </a>
              <a href="#" className="text-gray-500 hover:text-blue-600">
                Contact
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default MainLayout;
