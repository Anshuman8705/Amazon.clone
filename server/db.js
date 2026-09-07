import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { PRODUCTS } from "../src/data/products.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  price REAL NOT NULL,
  was REAL NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  art TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  prime INTEGER NOT NULL DEFAULT 0,
  bullets TEXT NOT NULL DEFAULT '[]',
  seed_rating REAL NOT NULL DEFAULT 0,
  seed_reviews INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS cart_items (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  card_last4 TEXT NOT NULL,
  subtotal REAL NOT NULL,
  tax REAL NOT NULL,
  total REAL NOT NULL,
  arrives TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  placed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS order_items (
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  title TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price REAL NOT NULL,
  PRIMARY KEY (order_id, product_id)
);
CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  name TEXT NOT NULL,
  line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS wishlist (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (product_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
`;

export function openDb(path = "server/data/store.db") {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  migrate(db);
  seedIfEmpty(db);
  seedAdmin(db);
  return db;
}

// Adds columns introduced after the first release to databases created before them.
function migrate(db) {
  const has = (table, col) => db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col);
  if (!has("users", "role")) db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'");
  if (!has("products", "active")) db.exec("ALTER TABLE products ADD COLUMN active INTEGER NOT NULL DEFAULT 1");
}

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// One admin account so the management screens can be used straight away.
export function seedAdmin(db) {
  const existing = db.prepare("SELECT id, role FROM users WHERE email = ?").get(ADMIN_EMAIL);
  if (existing) {
    if (existing.role !== "admin") db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
    return;
  }
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
    .run("Store Admin", ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASSWORD, 10));
}

export function seedIfEmpty(db) {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM products").get();
  if (n > 0) return false;
  const insert = db.prepare(`
    INSERT INTO products (id, title, brand, price, was, category, image, art, stock, prime, bullets, seed_rating, seed_reviews)
    VALUES (@id, @title, @brand, @price, @was, @category, @image, @art, @stock, @prime, @bullets, @rating, @reviews)`);
  const tx = db.transaction((rows) => {
    for (const p of rows) {
      insert.run({
        ...p,
        image: p.image || null,
        art: p.art || null,
        prime: p.prime ? 1 : 0,
        bullets: JSON.stringify(p.bullets),
      });
    }
  });
  tx(PRODUCTS);
  return true;
}

export function resetDb(db) {
  db.exec("DELETE FROM reviews; DELETE FROM wishlist; DELETE FROM addresses; DELETE FROM order_items; DELETE FROM orders; DELETE FROM cart_items; DELETE FROM users; DELETE FROM products;");
  seedIfEmpty(db);
  seedAdmin(db);
}

export const dbExists = (path) => existsSync(path);
