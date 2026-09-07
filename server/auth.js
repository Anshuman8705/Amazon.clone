import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("JWT_SECRET is not set. Set it in the environment before deploying.");
}

export const signToken = (user) =>
  jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role || "customer" }, JWT_SECRET, { expiresIn: "7d" });

// Attaches req.user when a valid Bearer token is present, otherwise leaves it undefined.
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = { id: payload.sub, name: payload.name, email: payload.email, role: payload.role || "customer" };
    } catch {
      // Expired or tampered token: treat as signed out rather than erroring.
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Sign in to do that" });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Sign in to do that" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "That area is for store administrators" });
  next();
}
