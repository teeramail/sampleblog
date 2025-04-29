import { type GetServerSidePropsContext } from "next";

// Define a basic user type
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// Define session type
export interface Session {
  user: User;
  expires: string;
}

// Get the auth session from the server context
export const getServerAuthSession = async (ctx?: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  // Mock session for development
  return {
    user: {
      id: "mock-user-id",
      name: "Mock User",
      email: "mock@example.com",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  } satisfies Session;
}; 