import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL ?? true, credentials: true }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    env: process.env.APP_ENV ?? "local",
    status: "healthy",
  });
});

app.get("/api/tenant/config", (req, res) => {
  const slug = req.header("x-tenant") ?? "marketplace";
  res.json({ slug, hasOrderHistory: true, hasDeliveryProcessing: false });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`API listening on ${port}`));
