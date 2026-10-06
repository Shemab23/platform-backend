import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { db } from "./db";
import { sql } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL ?? true, credentials: true }));

app.get("/health", async (_req, res) => {
  try {
    // We execute the raw query statement
    const dbTest = await db.execute(sql`SELECT NOW() as now;`);

    const rows = dbTest.rows as Array<{ now: string }>;

    res.json({
      ok: true,
      env: process.env.APP_ENV ?? "local",
      status: "healthy",
      database: "connected",
      timestamp: rows[0]?.now,
    });
  } catch (error: any) {
    console.error("❌ Database connection failed:", error);
    res.status(500).json({
      ok: false,
      status: "unhealthy",
      database: "disconnected",
      error: error?.message || "Unknown database error",
    });
  }
});

app.get("/api/tenant/config", (req, res) => {
  const slug = req.header("x-tenant") ?? "marketplace";
  res.json({ slug, hasOrderHistory: true, hasDeliveryProcessing: false });
});

export default app;
