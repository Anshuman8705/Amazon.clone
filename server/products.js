// Shared product queries. Rating combines the seeded review data with real
// reviews written through the API so new reviews move the average.

const SELECT = `
  SELECT p.*,
    COALESCE(r.n, 0) AS live_reviews,
    COALESCE(r.sum_rating, 0) AS live_rating_sum
  FROM products p
  LEFT JOIN (
    SELECT product_id, COUNT(*) AS n, SUM(rating) AS sum_rating FROM reviews GROUP BY product_id
  ) r ON r.product_id = p.id`;

export function shape(row) {
  if (!row) return null;
  const reviews = row.seed_reviews + row.live_reviews;
  const rating = reviews
    ? (row.seed_rating * row.seed_reviews + row.live_rating_sum) / reviews
    : 0;
  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    price: row.price,
    was: row.was,
    category: row.category,
    image: row.image,
    art: row.art,
    stock: row.stock,
    prime: Boolean(row.prime),
    active: row.active !== 0,
    bullets: JSON.parse(row.bullets),
    rating: Math.round(rating * 10) / 10,
    ratingExact: rating,
    reviews,
    discount: Math.round((1 - row.price / row.was) * 100),
  };
}

export const SORTS = {
  featured: "p.id ASC",
  low: "p.price ASC",
  high: "p.price DESC",
  rating: "rating DESC",
  discount: "(p.was / p.price) DESC",
  newest: "p.created_at DESC, p.id DESC",
};

export function listProducts(db, query = {}) {
  const where = [];
  const params = {};
  if (!query.includeInactive) where.push("p.active = 1");
  if (query.q) {
    where.push("(p.title LIKE @q OR p.brand LIKE @q OR p.category LIKE @q)");
    params.q = `%${query.q}%`;
  }
  const cats = Array.isArray(query.category) ? query.category : query.category ? String(query.category).split(",") : [];
  if (cats.length) {
    where.push(`p.category IN (${cats.map((_, i) => `@c${i}`).join(",")})`);
    cats.forEach((c, i) => { params[`c${i}`] = c; });
  }
  if (query.minPrice !== undefined) { where.push("p.price >= @minPrice"); params.minPrice = Number(query.minPrice); }
  if (query.maxPrice !== undefined) { where.push("p.price <= @maxPrice"); params.maxPrice = Number(query.maxPrice); }
  if (query.prime === "1" || query.prime === true) where.push("p.prime = 1");
  if (query.deals === "1" || query.deals === true) where.push("(1 - p.price / p.was) >= 0.25");
  if (query.inStock === "1") where.push("p.stock > 0");

  const sql = `${SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`;
  let rows = db.prepare(sql).all(params).map(shape);

  // Rating filter and rating sort depend on the combined rating, so apply in JS.
  if (query.minRating) rows = rows.filter((p) => p.rating >= Number(query.minRating));
  const sort = query.sort || "featured";
  const byRating = (a, b) => b.rating - a.rating || a.id - b.id;
  const sorters = {
    featured: (a, b) => a.id - b.id,
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
    rating: byRating,
    discount: (a, b) => b.was / b.price - a.was / a.price,
    newest: (a, b) => b.id - a.id,
  };
  rows.sort(sorters[sort] || sorters.featured);
  if (query.limit) rows = rows.slice(0, Number(query.limit));
  return rows;
}

export function validateProductInput(body, { partial = false } = {}) {
  const fields = {};
  const out = {};
  const str = (k, min, label) => {
    if (body[k] === undefined) { if (!partial) fields[k] = `Enter ${label}`; return; }
    const v = String(body[k]).trim();
    if (v.length < min) fields[k] = `Enter ${label}`; else out[k] = v;
  };
  const num = (k, label, { int = false, min = 0 } = {}) => {
    if (body[k] === undefined) { if (!partial) fields[k] = `Enter ${label}`; return; }
    const v = Number(body[k]);
    if (!Number.isFinite(v) || v < min || (int && !Number.isInteger(v))) fields[k] = `Enter a valid ${label}`; else out[k] = v;
  };
  str("title", 5, "a product title");
  str("brand", 2, "a brand");
  str("category", 2, "a category");
  num("price", "price", { min: 0.01 });
  num("was", "list price", { min: 0.01 });
  num("stock", "stock quantity", { int: true, min: 0 });
  if (out.price !== undefined && out.was !== undefined && out.was < out.price) fields.was = "List price should be at least the sale price";
  if (body.prime !== undefined) out.prime = body.prime ? 1 : 0;
  if (body.active !== undefined) out.active = body.active ? 1 : 0;
  if (body.image !== undefined) out.image = String(body.image || "").trim() || null;
  if (body.art !== undefined) out.art = String(body.art || "").trim() || null;
  if (body.bullets !== undefined) {
    const list = Array.isArray(body.bullets) ? body.bullets : String(body.bullets).split("\n");
    out.bullets = JSON.stringify(list.map((b) => String(b).trim()).filter(Boolean));
  }
  return { fields, out };
}

export function getProduct(db, id) {
  return shape(db.prepare(`${SELECT} WHERE p.id = ?`).get(Number(id)));
}
