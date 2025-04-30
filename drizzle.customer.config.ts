import { defineConfig } from "drizzle-kit";
import { baseConfig } from "./drizzle.config.base";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database URL for customer database
const DATABASE_URL = "postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/customer?sslmode=require";

export default defineConfig({
  ...baseConfig,
  dbCredentials: {
    url: DATABASE_URL,
  },
  out: "./drizzle/customer", // Separate migration folder for customer
}); 