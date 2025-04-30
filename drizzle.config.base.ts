import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Base configuration that other configurations will extend
export const baseConfig = {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql" as const,
  verbose: true,
  breakpoints: true,
};

export default defineConfig({
  ...baseConfig,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
}); 