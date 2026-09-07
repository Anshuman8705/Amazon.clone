// Wipes every table and reloads the catalogue from src/data/products.js.
import "dotenv/config";
import { openDb, resetDb } from "./db.js";

const db = openDb(process.env.DB_PATH || "server/data/store.db");
resetDb(db);
const { n } = db.prepare("SELECT COUNT(*) AS n FROM products").get();
console.log(`Database reset. ${n} products loaded.`);
