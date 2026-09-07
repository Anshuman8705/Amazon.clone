import { Router } from "express";
import { requireAuth } from "../auth.js";

export const MAX_QTY = 10;

export function readCart(db, userId) {
  return db.prepare("SELECT product_id AS id, qty FROM cart_items WHERE user_id = ? ORDER BY rowid").all(userId);
}

function writeCart(db, userId, lines) {
  const del = db.prepare("DELETE FROM cart_items WHERE user_id = ?");
  const ins = db.prepare("INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, ?)");
  const exists = db.prepare("SELECT stock FROM products WHERE id = ?");
  db.transaction(() => {
    del.run(userId);
    for (const l of lines) {
      const id = Number(l.id);
      const qty = Math.min(MAX_QTY, Math.max(0, Math.floor(Number(l.qty))));
      if (!qty || !exists.get(id)) continue;
      ins.run(userId, id, qty);
    }
  })();
}

export default function cartRoutes(db) {
  const r = Router();

  r.get("/cart", requireAuth, (req, res) => res.json(readCart(db, req.user.id)));

  // Replace the whole cart. The client sends its full state after every change.
  r.put("/cart", requireAuth, (req, res) => {
    const lines = Array.isArray(req.body?.lines) ? req.body.lines : [];
    writeCart(db, req.user.id, lines);
    res.json(readCart(db, req.user.id));
  });

  // Merge a guest cart into the account cart on sign-in.
  r.post("/cart/merge", requireAuth, (req, res) => {
    const incoming = Array.isArray(req.body?.lines) ? req.body.lines : [];
    const current = readCart(db, req.user.id);
    const map = new Map(current.map((l) => [l.id, l.qty]));
    for (const l of incoming) {
      const id = Number(l.id);
      map.set(id, Math.min(MAX_QTY, (map.get(id) || 0) + Number(l.qty)));
    }
    writeCart(db, req.user.id, [...map].map(([id, qty]) => ({ id, qty })));
    res.json(readCart(db, req.user.id));
  });

  return r;
}
