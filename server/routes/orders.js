import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { getProduct } from "../products.js";
import { validateCheckout } from "../../src/utils/validation.js";
import { deliveryDate, orderNumber } from "../../src/utils/format.js";

export const TAX_RATE = 0.08;
export const MAX_QTY = 10;
export const STATUSES = ["confirmed", "shipped", "delivered", "cancelled"];

export function readOrder(db, id) {
  const o = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!o) return null;
  const items = db.prepare(`
    SELECT oi.product_id AS id, oi.title, oi.qty, oi.price, p.image, p.art
    FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`).all(id);
  const customer = o.user_id ? db.prepare("SELECT name, email FROM users WHERE id = ?").get(o.user_id) : null;
  return {
    customer: customer ? { ...customer, id: o.user_id } : { name: o.name, email: o.email, guest: true },
    id: o.id,
    userId: o.user_id,
    name: o.name,
    email: o.email,
    address: o.address,
    cardLast4: o.card_last4,
    subtotal: o.subtotal,
    tax: o.tax,
    total: o.total,
    arrives: o.arrives,
    status: o.status,
    placedAt: o.placed_at,
    items,
  };
}

export default function orderRoutes(db) {
  const r = Router();

  r.post("/orders", (req, res) => {
    const form = req.body?.customer || {};
    const lines = Array.isArray(req.body?.lines) ? req.body.lines : [];
    const fields = validateCheckout({
      name: "", email: "", address: "", city: "", state: "", zip: "", cardName: "", card: "", expiry: "", cvv: "",
      ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, String(v ?? "")])),
    });
    if (Object.keys(fields).length) return res.status(400).json({ error: "Check the checkout form", fields });
    if (!lines.length) return res.status(400).json({ error: "Your cart is empty" });

    // Everything below runs in one transaction: either every line is in
    // stock and gets reserved, or nothing changes.
    const decrement = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
    const insertOrder = db.prepare(`
      INSERT INTO orders (id, user_id, name, email, address, card_last4, subtotal, tax, total, arrives)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, title, qty, price) VALUES (?, ?, ?, ?, ?)");
    const clearCart = db.prepare("DELETE FROM cart_items WHERE user_id = ?");

    try {
      const order = db.transaction(() => {
        const items = [];
        for (const l of lines) {
          const product = getProduct(db, l.id);
          const qty = Math.floor(Number(l.qty));
          if (!product) throw Object.assign(new Error(`Product ${l.id} no longer exists`), { status: 409 });
          if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw Object.assign(new Error(`Quantity for ${product.title} must be 1 to ${MAX_QTY}`), { status: 400 });
          const result = decrement.run(qty, product.id, qty);
          if (result.changes === 0) {
            throw Object.assign(new Error(`Only ${product.stock} of "${product.title}" left in stock`), { status: 409, productId: product.id, available: product.stock });
          }
          items.push({ id: product.id, title: product.title, qty, price: product.price });
        }
        const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
        const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;
        const id = orderNumber();
        const address = `${form.address.trim()}, ${form.city.trim()}, ${form.state.trim()} ${form.zip.trim()}`;
        insertOrder.run(id, req.user?.id ?? null, form.name.trim(), form.email.trim().toLowerCase(), address,
          String(form.card).replace(/\D/g, "").slice(-4), subtotal, tax, total, deliveryDate());
        for (const i of items) insertItem.run(id, i.id, i.title, i.qty, i.price);
        if (req.user) clearCart.run(req.user.id);
        return readOrder(db, id);
      })();
      res.status(201).json(order);
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message, productId: e.productId, available: e.available });
      throw e;
    }
  });

  r.get("/orders", requireAuth, (req, res) => {
    const ids = db.prepare("SELECT id FROM orders WHERE user_id = ? ORDER BY placed_at DESC, rowid DESC").all(req.user.id);
    res.json(ids.map(({ id }) => readOrder(db, id)));
  });

  // Order IDs are unguessable, so a guest can reopen their confirmation.
  r.get("/orders/:id", (req, res) => {
    const order = readOrder(db, req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId && order.userId !== req.user?.id && req.user?.role !== "admin") return res.status(403).json({ error: "That order belongs to another account" });
    res.json(order);
  });

  // Restores stock for every line. Used by customer cancellation and by
  // admins moving an order to cancelled.
  const restock = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
  const setStatus = db.prepare("UPDATE orders SET status = ? WHERE id = ?");
  const cancelOrder = db.transaction((order) => {
    for (const i of order.items) restock.run(i.qty, i.id);
    setStatus.run("cancelled", order.id);
  });

  r.post("/orders/:id/cancel", requireAuth, (req, res) => {
    const order = readOrder(db, req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== req.user.id) return res.status(403).json({ error: "That order belongs to another account" });
    if (order.status !== "confirmed") return res.status(409).json({ error: `This order has already been ${order.status} and cannot be cancelled` });
    cancelOrder(order);
    res.json(readOrder(db, order.id));
  });

  r.get("/admin/orders", requireAdmin, (req, res) => {
    const status = STATUSES.includes(req.query.status) ? req.query.status : null;
    const ids = db.prepare(`SELECT id FROM orders ${status ? "WHERE status = ?" : ""} ORDER BY placed_at DESC, rowid DESC`).all(...(status ? [status] : []));
    res.json(ids.map(({ id }) => readOrder(db, id)));
  });

  r.patch("/admin/orders/:id", requireAdmin, (req, res) => {
    const order = readOrder(db, req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const status = String(req.body?.status || "");
    if (!STATUSES.includes(status)) return res.status(400).json({ error: `Status must be one of ${STATUSES.join(", ")}` });
    if (order.status === "cancelled" && status !== "cancelled") return res.status(409).json({ error: "A cancelled order cannot be reopened" });
    if (status === "cancelled" && order.status !== "cancelled") cancelOrder(order);
    else setStatus.run(status, order.id);
    res.json(readOrder(db, order.id));
  });

  r.get("/admin/stats", requireAdmin, (_req, res) => {
    const row = (sql) => db.prepare(sql).get();
    res.json({
      products: row("SELECT COUNT(*) AS n FROM products WHERE active = 1").n,
      lowStock: row("SELECT COUNT(*) AS n FROM products WHERE active = 1 AND stock <= 5").n,
      customers: row("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'").n,
      orders: row("SELECT COUNT(*) AS n FROM orders").n,
      openOrders: row("SELECT COUNT(*) AS n FROM orders WHERE status IN ('confirmed','shipped')").n,
      revenue: row("SELECT COALESCE(SUM(total), 0) AS n FROM orders WHERE status != 'cancelled'").n,
      reviews: row("SELECT COUNT(*) AS n FROM reviews").n,
      byStatus: Object.fromEntries(db.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all().map((r) => [r.status, r.n])),
    });
  });

  return r;
}
