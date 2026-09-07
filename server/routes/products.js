import { Router } from "express";
import { listProducts, getProduct, validateProductInput } from "../products.js";
import { requireAuth, requireAdmin } from "../auth.js";
import { CATEGORIES } from "../../src/data/products.js";

export default function productRoutes(db) {
  const r = Router();

  r.get("/categories", (_req, res) => {
    const counts = db.prepare("SELECT category, COUNT(*) AS n FROM products GROUP BY category").all();
    res.json(CATEGORIES.map((c) => ({ ...c, count: counts.find((x) => x.category === c.slug)?.n || 0 })));
  });

  r.get("/products", (req, res) => {
    res.json(listProducts(db, { ...req.query, includeInactive: false }));
  });

  r.get("/products/:id", (req, res) => {
    const product = getProduct(db, req.params.id);
    if (!product || (!product.active && req.user?.role !== "admin")) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  });

  // Wishlist -------------------------------------------------------------
  const readWishlist = (userId) =>
    db.prepare("SELECT product_id FROM wishlist WHERE user_id = ? ORDER BY added_at DESC").all(userId)
      .map((w) => getProduct(db, w.product_id)).filter((p) => p && p.active);

  r.get("/wishlist", requireAuth, (req, res) => res.json(readWishlist(req.user.id)));

  r.post("/wishlist", requireAuth, (req, res) => {
    const product = getProduct(db, req.body?.productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    db.prepare("INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)").run(req.user.id, product.id);
    res.status(201).json(readWishlist(req.user.id));
  });

  r.delete("/wishlist/:productId", requireAuth, (req, res) => {
    db.prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?").run(req.user.id, Number(req.params.productId));
    res.json(readWishlist(req.user.id));
  });

  // Admin product management --------------------------------------------
  r.get("/admin/products", requireAdmin, (req, res) => {
    res.json(listProducts(db, { ...req.query, includeInactive: true, sort: req.query.sort || "newest" }));
  });

  r.post("/admin/products", requireAdmin, (req, res) => {
    const { fields, out } = validateProductInput(req.body || {});
    if (Object.keys(fields).length) return res.status(400).json({ error: "Check the product form", fields });
    const info = db.prepare(`
      INSERT INTO products (title, brand, price, was, category, image, art, stock, prime, bullets, active)
      VALUES (@title, @brand, @price, @was, @category, @image, @art, @stock, @prime, @bullets, @active)`)
      .run({ image: null, art: null, prime: 0, bullets: "[]", active: 1, ...out });
    res.status(201).json(getProduct(db, info.lastInsertRowid));
  });

  r.patch("/admin/products/:id", requireAdmin, (req, res) => {
    const existing = getProduct(db, req.params.id);
    if (!existing) return res.status(404).json({ error: "Product not found" });
    const { fields, out } = validateProductInput(req.body || {}, { partial: true });
    if (out.price !== undefined && out.was === undefined && existing.was < out.price) out.was = out.price;
    if (Object.keys(fields).length) return res.status(400).json({ error: "Check the product form", fields });
    const keys = Object.keys(out);
    if (!keys.length) return res.json(existing);
    db.prepare(`UPDATE products SET ${keys.map((k) => `${k} = @${k}`).join(", ")} WHERE id = @id`).run({ ...out, id: existing.id });
    res.json(getProduct(db, existing.id));
  });

  // Products with order history are archived rather than deleted so past
  // orders keep their line items; unreferenced ones are removed outright.
  r.delete("/admin/products/:id", requireAdmin, (req, res) => {
    const existing = getProduct(db, req.params.id);
    if (!existing) return res.status(404).json({ error: "Product not found" });
    const referenced = db.prepare("SELECT COUNT(*) AS n FROM order_items WHERE product_id = ?").get(existing.id).n;
    db.transaction(() => {
      db.prepare("DELETE FROM cart_items WHERE product_id = ?").run(existing.id);
      db.prepare("DELETE FROM wishlist WHERE product_id = ?").run(existing.id);
      if (referenced) {
        db.prepare("UPDATE products SET active = 0, stock = 0 WHERE id = ?").run(existing.id);
      } else {
        db.prepare("DELETE FROM reviews WHERE product_id = ?").run(existing.id);
        db.prepare("DELETE FROM products WHERE id = ?").run(existing.id);
      }
    })();
    res.json({ ok: true, archived: Boolean(referenced) });
  });

  r.get("/admin/customers", requireAdmin, (_req, res) => {
    res.json(db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.created_at AS createdAt,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders,
        (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled') AS spent
      FROM users u ORDER BY u.created_at DESC`).all());
  });

  r.get("/products/:id/reviews", (req, res) => {
    const rows = db.prepare(`
      SELECT r.id, r.rating, r.title, r.body, r.created_at AS createdAt, u.name AS author, r.user_id AS userId
      FROM reviews r JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ? ORDER BY r.created_at DESC, r.id DESC`).all(Number(req.params.id));
    res.json(rows);
  });

  r.post("/products/:id/reviews", requireAuth, (req, res) => {
    const product = getProduct(db, req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const rating = Number(req.body?.rating);
    const title = String(req.body?.title || "").trim();
    const body = String(req.body?.body || "").trim();
    const errors = {};
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Choose a star rating";
    if (title.length < 3) errors.title = "Give your review a short title";
    if (body.length < 10) errors.body = "Write at least a sentence";
    if (Object.keys(errors).length) return res.status(400).json({ error: "Check the review form", fields: errors });

    db.prepare(`
      INSERT INTO reviews (product_id, user_id, rating, title, body) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(product_id, user_id) DO UPDATE SET rating = excluded.rating, title = excluded.title, body = excluded.body, created_at = datetime('now')`)
      .run(product.id, req.user.id, rating, title, body);
    res.status(201).json({ ok: true, product: getProduct(db, product.id) });
  });

  return r;
}
