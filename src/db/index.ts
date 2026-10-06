import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";
import "dotenv/config";

export let db: any;

if (process.env.NODE_ENV === "test") {
  // LEGITIMATE IN-MEMORY POSTGRES ENGINE
  // This spins up an isolated, full-featured instance of Postgres locally in-memory
  db = drizzlePglite({ schema });
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is missing!");
  }
  const sql = neon(process.env.DATABASE_URL);
  db = drizzleNeon(sql, { schema });
}
