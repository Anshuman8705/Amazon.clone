import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { openDb } from "./db.js";
import { optionalAuth } from "./auth.js";
import productRoutes from "./routes/products.js";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";

export function createApp({ dbPath = process.env.DB_PATH || "server/data/store.db", serveClient = true } = {}) {
  const db = openDb(dbPath);
  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));
  app.use(optionalAuth);

  app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  app.use("/api", productRoutes(db));
  app.use("/api", authRoutes(db));
  app.use("/api", cartRoutes(db));
  app.use("/api", orderRoutes(db));
  app.use("/api", (_req, res) => res.status(404).json({ error: "No such endpoint" }));

  // In production the same process serves the built React app.
  const dist = resolve("dist");
  if (serveClient && existsSync(join(dist, "index.html"))) {
    app.use(express.static(dist, { maxAge: "1h", index: false }));
    app.get("*", (_req, res) => res.sendFile(join(dist, "index.html")));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.type === "entity.parse.failed" ? "Request body is not valid JSON" : "Something went wrong on the server" });
  });

  app.locals.db = db;
  return app;
}
