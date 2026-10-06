import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle", // Output folder in root matching NobelSource
  schema: "./src/db/schema.ts", // Pointing directly to your schema
  dialect: "postgresql", // Using PostgreSQL for Neon
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Uses the environment variable
  },
});
