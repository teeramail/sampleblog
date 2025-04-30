import { defineConfig } from "drizzle-kit";
import { baseConfig } from "./drizzle.config.base";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Use only the keepdoc database configuration
export default defineConfig({
  ...baseConfig,
  dbCredentials: {
    // Use the DATABASE_URL directly, which should point to the keepdoc database
    url: process.env.DATABASE_URL!,
  },
  // This file will now replace the multi-database configuration
  out: "./drizzle/keepdoc",
});
