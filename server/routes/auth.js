import { Router } from "express";
import bcrypt from "bcryptjs";
import { signToken, requireAuth } from "../auth.js";
import { isEmail } from "../../src/utils/validation.js";

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role || "customer" });

export default function authRoutes(db) {
  const r = Router();

  r.post("/auth/register", (req, res) => {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const fields = {};
    if (name.length < 2) fields.name = "Enter your name";
    if (!isEmail(email)) fields.email = "Enter a valid email address";
    if (password.length < 6) fields.password = "Password must be at least 6 characters";
    if (Object.keys(fields).length) return res.status(400).json({ error: "Check the form", fields });

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "An account with that email already exists", fields: { email: "Already registered. Sign in instead." } });

    const password_hash = bcrypt.hashSync(password, 10);
    const info = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)").run(name, email, password_hash);
    const user = { id: info.lastInsertRowid, name, email, role: "customer" };
    res.status(201).json({ token: signToken(user), user });
  });

  r.post("/auth/login", (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return res.status(401).json({ error: "Email or password is incorrect" });
    }
    res.json({ token: signToken(row), user: publicUser(row) });
  });

  r.get("/auth/me", requireAuth, (req, res) => {
    const row = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(req.user.id);
    if (!row) return res.status(401).json({ error: "Account no longer exists" });
    res.json(publicUser(row));
  });

  r.patch("/account", requireAuth, (req, res) => {
    const name = String(req.body?.name || "").trim();
    if (name.length < 2) return res.status(400).json({ error: "Check the form", fields: { name: "Enter your name" } });
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, req.user.id);
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    res.json({ token: signToken(row), user: publicUser(row) });
  });

  r.post("/account/password", requireAuth, (req, res) => {
    const current = String(req.body?.current || "");
    const next = String(req.body?.next || "");
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!bcrypt.compareSync(current, row.password_hash)) return res.status(400).json({ error: "Check the form", fields: { current: "Current password is incorrect" } });
    if (next.length < 6) return res.status(400).json({ error: "Check the form", fields: { next: "New password must be at least 6 characters" } });
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(next, 10), req.user.id);
    res.json({ ok: true });
  });

  const readAddresses = (userId) => db.prepare("SELECT id, label, name, line1, city, state, zip, is_default AS isDefault FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id").all(userId).map((a) => ({ ...a, isDefault: Boolean(a.isDefault) }));

  r.get("/account/addresses", requireAuth, (req, res) => res.json(readAddresses(req.user.id)));

  r.post("/account/addresses", requireAuth, (req, res) => {
    const b = req.body || {};
    const fields = {};
    const get = (k, label, min = 1) => { const v = String(b[k] || "").trim(); if (v.length < min) fields[k] = `Enter ${label}`; return v; };
    const a = { label: String(b.label || "Home").trim() || "Home", name: get("name", "a name", 2), line1: get("line1", "a street address", 5), city: get("city", "a city"), state: get("state", "a state"), zip: get("zip", "a postal code") };
    if (!/^\d{5,6}$/.test(a.zip)) fields.zip = "Enter a 5 or 6 digit postal code";
    if (Object.keys(fields).length) return res.status(400).json({ error: "Check the address", fields });
    const count = db.prepare("SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?").get(req.user.id).n;
    const makeDefault = b.isDefault || count === 0;
    db.transaction(() => {
      if (makeDefault) db.prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?").run(req.user.id);
      db.prepare("INSERT INTO addresses (user_id, label, name, line1, city, state, zip, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(req.user.id, a.label, a.name, a.line1, a.city, a.state, a.zip, makeDefault ? 1 : 0);
    })();
    res.status(201).json(readAddresses(req.user.id));
  });

  r.post("/account/addresses/:id/default", requireAuth, (req, res) => {
    const own = db.prepare("SELECT id FROM addresses WHERE id = ? AND user_id = ?").get(Number(req.params.id), req.user.id);
    if (!own) return res.status(404).json({ error: "Address not found" });
    db.transaction(() => {
      db.prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?").run(req.user.id);
      db.prepare("UPDATE addresses SET is_default = 1 WHERE id = ?").run(own.id);
    })();
    res.json(readAddresses(req.user.id));
  });

  r.delete("/account/addresses/:id", requireAuth, (req, res) => {
    db.prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?").run(Number(req.params.id), req.user.id);
    const rest = readAddresses(req.user.id);
    if (rest.length && !rest.some((a) => a.isDefault)) db.prepare("UPDATE addresses SET is_default = 1 WHERE id = ?").run(rest[0].id);
    res.json(readAddresses(req.user.id));
  });

  return r;
}
