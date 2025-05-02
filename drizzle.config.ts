import { defineConfig } from "drizzle-kit";
import { baseConfig } from "./drizzle.config.base";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration for the realestate database
export default defineConfig({
  ...baseConfig,
  dbCredentials: {
    // Use the DATABASE_URL for the realestate database
    url: process.env.DATABASE_URL!,
  },
  // Output migrations to the realestate directory
  out: "./drizzle/realestate",
});
