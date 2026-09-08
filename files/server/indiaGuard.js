/**
 * This localisation release starts a SEPARATE INR demo database.
 * It is NOT a legacy USD database migration. Never relabel existing amounts as INR.
 * Invoke immediately after opening the connection, before schema creation/seeding.
 */
export function assertIndiaDatabase(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name);
  const hasMeta = tables.includes("nimbus_store_meta");
  if (hasMeta) {
    const row = db.prepare("SELECT value FROM nimbus_store_meta WHERE key = 'currency'").get();
    if (row?.value !== "INR") throw new Error("This database is not marked INR. Currency migration is required; no amounts were changed.");
    return;
  }
  // Even an apparently empty legacy schema is not repurposed automatically.
  if (["products", "orders", "users", "order_items", "cart_items", "reviews"].some((name) => tables.includes(name))) {
    throw new Error("Legacy/unmarked database detected. Keep it unchanged. Use a NEW DB_PATH such as server/data/store-inr.db. Existing USD records need a separate, tested currency-aware migration.");
  }
  db.exec("CREATE TABLE nimbus_store_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  db.prepare("INSERT INTO nimbus_store_meta (key, value) VALUES ('currency', 'INR')").run();
}

export function assertHostingPolicy(env = process.env) {
  if (env.RENDER && env.NODE_ENV === "production" && env.ALLOW_EPHEMERAL_DEMO !== "true") {
    throw new Error("This release uses local SQLite. Render free storage is ephemeral. Production deployment is blocked until durable free storage is integrated. ALLOW_EPHEMERAL_DEMO=true is ONLY for explicitly disposable sample data, never retained records.");
  }
}
