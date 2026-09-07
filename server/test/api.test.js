import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { PRODUCTS } from "../../src/data/products.js";

const customer = {
  name: "Test Person", email: "buyer@example.com", address: "1 Test Street", city: "Nanded", state: "MH", zip: "431601",
  cardName: "TEST PERSON", card: "4242 4242 4242 4242", expiry: "12/40", cvv: "123",
};

let app;
beforeAll(() => { app = createApp({ dbPath: ":memory:", serveClient: false }); });

const register = async (email = `u${Date.now()}${Math.random()}@example.com`) => {
  const res = await request(app).post("/api/auth/register").send({ name: "Reviewer", email, password: "secret123" });
  expect(res.status).toBe(201);
  return res.body.token;
};

describe("products", () => {
  it("lists the seeded catalogue", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(PRODUCTS.length);
    expect(res.body[0]).toMatchObject({ id: 1, rating: expect.any(Number), discount: expect.any(Number) });
  });

  it("filters by category, price band and search, and sorts", async () => {
    const pets = await request(app).get("/api/products?category=pets");
    expect(pets.body.every((p) => p.category === "pets")).toBe(true);
    const cheap = await request(app).get("/api/products?maxPrice=25&sort=high");
    expect(cheap.body.every((p) => p.price <= 25)).toBe(true);
    expect(cheap.body.map((p) => p.price)).toEqual([...cheap.body.map((p) => p.price)].sort((a, b) => b - a));
    const search = await request(app).get("/api/products?q=kettlebell");
    expect(search.body).toHaveLength(1);
    const deals = await request(app).get("/api/products?deals=1");
    expect(deals.body.every((p) => p.discount >= 25)).toBe(true);
  });

  it("404s for an unknown product", async () => {
    expect((await request(app).get("/api/products/9999")).status).toBe(404);
  });
});

describe("auth", () => {
  it("registers, logs in, and identifies the user", async () => {
    const reg = await request(app).post("/api/auth/register").send({ name: "Ann", email: "ann@example.com", password: "secret123" });
    expect(reg.status).toBe(201);
    const dup = await request(app).post("/api/auth/register").send({ name: "Ann", email: "ANN@example.com", password: "secret123" });
    expect(dup.status).toBe(409);
    const bad = await request(app).post("/api/auth/login").send({ email: "ann@example.com", password: "wrong" });
    expect(bad.status).toBe(401);
    const ok = await request(app).post("/api/auth/login").send({ email: "ann@example.com", password: "secret123" });
    expect(ok.status).toBe(200);
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${ok.body.token}`);
    expect(me.body).toMatchObject({ name: "Ann", email: "ann@example.com" });
  });

  it("rejects protected routes without a token", async () => {
    expect((await request(app).get("/api/cart")).status).toBe(401);
    expect((await request(app).get("/api/orders")).status).toBe(401);
  });
});

describe("cart", () => {
  it("stores, merges and caps quantities", async () => {
    const token = await register();
    const auth = (r) => r.set("Authorization", `Bearer ${token}`);
    await auth(request(app).put("/api/cart")).send({ lines: [{ id: 1, qty: 2 }] });
    const merged = await auth(request(app).post("/api/cart/merge")).send({ lines: [{ id: 1, qty: 9 }, { id: 2, qty: 1 }, { id: 9999, qty: 1 }] });
    expect(merged.body).toEqual([{ id: 1, qty: 10 }, { id: 2, qty: 1 }]);
  });
});

describe("orders", () => {
  it("rejects an invalid card with field errors", async () => {
    const res = await request(app).post("/api/orders").send({ customer: { ...customer, card: "4242 4242 4242 4241" }, lines: [{ id: 6, qty: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.fields.card).toMatch(/checksum/);
  });

  it("places a guest order, decrements stock, and can be fetched by id", async () => {
    const before = (await request(app).get("/api/products/6")).body.stock;
    const res = await request(app).post("/api/orders").send({ customer, lines: [{ id: 6, qty: 2 }] });
    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^402-\d{7}-\d{7}$/);
    expect(res.body.cardLast4).toBe("4242");
    expect(res.body.total).toBeCloseTo(res.body.subtotal * 1.08, 2);
    const after = (await request(app).get("/api/products/6")).body.stock;
    expect(after).toBe(before - 2);
    const fetched = await request(app).get(`/api/orders/${res.body.id}`);
    expect(fetched.body.items[0]).toMatchObject({ id: 6, qty: 2 });
  });

  it("refuses to oversell and leaves stock untouched", async () => {
    const product = (await request(app).get("/api/products/2")).body;
    const res = await request(app).post("/api/orders").send({ customer, lines: [{ id: 1, qty: 1 }, { id: 2, qty: product.stock + 1 }] });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/left in stock/);
    expect((await request(app).get("/api/products/1")).body.stock).toBe(PRODUCTS[0].stock);
  });

  it("lists an account's orders and empties the server cart", async () => {
    const token = await register();
    const auth = (r) => r.set("Authorization", `Bearer ${token}`);
    await auth(request(app).put("/api/cart")).send({ lines: [{ id: 12, qty: 1 }] });
    const placed = await auth(request(app).post("/api/orders")).send({ customer, lines: [{ id: 12, qty: 1 }] });
    expect(placed.status).toBe(201);
    expect((await auth(request(app).get("/api/cart"))).body).toEqual([]);
    const list = await auth(request(app).get("/api/orders"));
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(placed.body.id);
    const other = await register();
    expect((await request(app).get(`/api/orders/${placed.body.id}`).set("Authorization", `Bearer ${other}`)).status).toBe(403);
  });
});

describe("reviews", () => {
  it("requires sign-in, validates, and moves the product rating", async () => {
    expect((await request(app).post("/api/products/7/reviews").send({ rating: 5, title: "Great", body: "Really good board." })).status).toBe(401);
    const token = await register();
    const auth = (r) => r.set("Authorization", `Bearer ${token}`);
    const bad = await auth(request(app).post("/api/products/7/reviews")).send({ rating: 0, title: "x", body: "short" });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.fields).sort()).toEqual(["body", "rating", "title"]);
    const before = (await request(app).get("/api/products/7")).body;
    const ok = await auth(request(app).post("/api/products/7/reviews")).send({ rating: 1, title: "Cracked", body: "It split down the middle after a week." });
    expect(ok.status).toBe(201);
    expect(ok.body.product.reviews).toBe(before.reviews + 1);
    expect(ok.body.product.ratingExact).toBeLessThan(before.ratingExact);
    const list = await request(app).get("/api/products/7/reviews");
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ author: "Reviewer", rating: 1 });
  });
});

describe("account, addresses and wishlist", () => {
  it("updates name, changes password, and manages addresses", async () => {
    const token = await register("acct@example.com");
    const auth = (r) => r.set("Authorization", `Bearer ${token}`);
    const renamed = await auth(request(app).patch("/api/account")).send({ name: "Renamed Person" });
    expect(renamed.body.user.name).toBe("Renamed Person");
    expect((await auth(request(app).post("/api/account/password")).send({ current: "wrong", next: "newsecret" })).status).toBe(400);
    expect((await auth(request(app).post("/api/account/password")).send({ current: "secret123", next: "newsecret" })).status).toBe(200);
    expect((await request(app).post("/api/auth/login").send({ email: "acct@example.com", password: "newsecret" })).status).toBe(200);

    const bad = await auth(request(app).post("/api/account/addresses")).send({ name: "A", line1: "x", city: "", state: "", zip: "1" });
    expect(bad.status).toBe(400);
    const one = await auth(request(app).post("/api/account/addresses")).send({ label: "Home", name: "Renamed Person", line1: "1 Test Street", city: "Nanded", state: "MH", zip: "431601" });
    expect(one.status).toBe(201);
    expect(one.body[0].isDefault).toBe(true);
    const two = await auth(request(app).post("/api/account/addresses")).send({ label: "Office", name: "Renamed Person", line1: "9 Work Road", city: "Pune", state: "MH", zip: "411001", isDefault: true });
    expect(two.body.find((a) => a.label === "Office").isDefault).toBe(true);
    expect(two.body.find((a) => a.label === "Home").isDefault).toBe(false);
    const afterDelete = await auth(request(app).delete(`/api/account/addresses/${two.body.find((a) => a.label === "Office").id}`));
    expect(afterDelete.body).toHaveLength(1);
    expect(afterDelete.body[0].isDefault).toBe(true);
  });

  it("adds and removes wishlist items", async () => {
    const token = await register();
    const auth = (r) => r.set("Authorization", `Bearer ${token}`);
    expect((await request(app).get("/api/wishlist")).status).toBe(401);
    const added = await auth(request(app).post("/api/wishlist")).send({ productId: 3 });
    expect(added.status).toBe(201);
    expect(added.body.map((p) => p.id)).toEqual([3]);
    await auth(request(app).post("/api/wishlist")).send({ productId: 3 });
    expect((await auth(request(app).get("/api/wishlist"))).body).toHaveLength(1);
    expect((await auth(request(app).delete("/api/wishlist/3"))).body).toEqual([]);
  });
});

describe("order lifecycle and admin", () => {
  const adminLogin = async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "admin@example.com", password: "admin123" });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("admin");
    return res.body.token;
  };

  it("lets a customer cancel a confirmed order, restoring stock, but only once", async () => {
    const token = await register();
    const auth = (r) => r.set("Authorization", `Bearer ${token}`);
    const before = (await request(app).get("/api/products/14")).body.stock;
    const placed = await auth(request(app).post("/api/orders")).send({ customer, lines: [{ id: 14, qty: 3 }] });
    expect((await request(app).get("/api/products/14")).body.stock).toBe(before - 3);
    const cancelled = await auth(request(app).post(`/api/orders/${placed.body.id}/cancel`));
    expect(cancelled.body.status).toBe("cancelled");
    expect((await request(app).get("/api/products/14")).body.stock).toBe(before);
    expect((await auth(request(app).post(`/api/orders/${placed.body.id}/cancel`))).status).toBe(409);
  });

  it("blocks non-admins and lets the admin manage orders, products and see stats", async () => {
    const customerToken = await register();
    expect((await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${customerToken}`)).status).toBe(403);

    const admin = await adminLogin();
    const auth = (r) => r.set("Authorization", `Bearer ${admin}`);

    const stats = await auth(request(app).get("/api/admin/stats"));
    expect(stats.body).toMatchObject({ products: expect.any(Number), orders: expect.any(Number), revenue: expect.any(Number) });

    const placed = await request(app).post("/api/orders").send({ customer, lines: [{ id: 9, qty: 1 }] });
    const shipped = await auth(request(app).patch(`/api/admin/orders/${placed.body.id}`)).send({ status: "shipped" });
    expect(shipped.body.status).toBe("shipped");
    expect((await auth(request(app).patch(`/api/admin/orders/${placed.body.id}`)).send({ status: "bogus" })).status).toBe(400);
    const list = await auth(request(app).get("/api/admin/orders?status=shipped"));
    expect(list.body.some((o) => o.id === placed.body.id)).toBe(true);

    const bad = await auth(request(app).post("/api/admin/products")).send({ title: "x" });
    expect(bad.status).toBe(400);
    const created = await auth(request(app).post("/api/admin/products")).send({ title: "Admin Added Lamp", brand: "Norwood Living", category: "home", price: 20, was: 30, stock: 4, prime: true, bullets: "Warm light\nDimmable" });
    expect(created.status).toBe(201);
    expect(created.body.bullets).toEqual(["Warm light", "Dimmable"]);
    expect((await request(app).get("/api/products?q=Admin Added")).body).toHaveLength(1);

    const updated = await auth(request(app).patch(`/api/admin/products/${created.body.id}`)).send({ stock: 0, active: false });
    expect(updated.body.active).toBe(false);
    expect((await request(app).get("/api/products?q=Admin Added")).body).toHaveLength(0);
    expect((await request(app).get(`/api/products/${created.body.id}`)).status).toBe(404);
    expect((await auth(request(app).get(`/api/products/${created.body.id}`))).status).toBe(200);

    const deleted = await auth(request(app).delete(`/api/admin/products/${created.body.id}`));
    expect(deleted.body.archived).toBe(false);
    const archived = await auth(request(app).delete("/api/admin/products/9"));
    expect(archived.body.archived).toBe(true);
    expect((await auth(request(app).get("/api/admin/products"))).body.find((p) => p.id === 9).active).toBe(false);

    const customers = await auth(request(app).get("/api/admin/customers"));
    expect(customers.body.some((u) => u.role === "admin")).toBe(true);
  });
});
