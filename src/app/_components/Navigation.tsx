"use client";

import Link from "next/link";

export function Navigation() {
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
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
