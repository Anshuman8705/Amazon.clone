"""Exact, conflict-checked source transformations for the reviewed NimbusMart commit."""
import re

EXPECTED = {
    'src/utils/format.js': 'fd18c2839581788be7ef1402ce7b70821e4205a3',
    'src/utils/validation.js': '7aecb47ab0b6b4a3e292552217a4efba00a6feba',
    'src/components/Price.jsx': '5cbe30ff66f89193303c1b04e53f39e04b2a0c75',
    'src/pages/HomePage.jsx': 'c149a70c86bb761ff0e91d158533c3bba9d3ac0a',
    'src/pages/CheckoutPage.jsx': '213b6ed86812723e333472144aeff2b197206915',
    'src/data/products.js': '2eb3793d485013c5faf48c8b9229825d5f555d9e',
    'server/db.js': '747fdb8fb4a9a1fc6038f625f2caf1385c13ef8a',
    'server/app.js': '7e6f23ff73b575e4c637d3b1933bb6c7fea8e3ea',
    'server/auth.js': '02b8b3b2beaffc4739d3985881fe6d814f7f09e7',
    'server/routes/orders.js': '3f3a794750eb8f5e45c7087a8a93c19ebdbf5093',
    'src/api.js': '322e4abb799541048c427311b859d78dd55f87c0',
    'src/context/CartContext.jsx': 'f9358a352a8f68b9000ecb9d46bb2ba2b44daaa9',
    'src/components/FilterSidebar.jsx': 'd7d955ac26ec54ecaeea8eb4c2b79e092a8d1956',
    'src/components/Header.jsx': 'e3e709860c91a943e8861e7812c0c4a4267b7948',
    'src/components/ProductCard.jsx': '0d3e5143e3f8c0a245a0823655ca1fc94593ea05',
    'src/pages/ProductPage.jsx': 'a5df8cfc278fac0f78c206bedfcccf7e8b4acda1',
    'src/pages/CartPage.jsx': 'c579822f8efa92fe98b57d39b27a8901820637f9',
    'src/pages/OrderConfirmationPage.jsx': '5fc11c48c0acd175755a481a0277b18ae1fbd4e4',
    'src/pages/ListingPage.jsx': 'e481c07774b233b8745d2f119e19ac5ccd758740',
}

def one(text, old, new):
    n = text.count(old)
    if n != 1:
        raise ValueError(f'Expected one source anchor, found {n}: {old[:100]!r}')
    return text.replace(old, new, 1)

def between(text, start, end, new):
    if text.count(start) != 1 or text.count(end) != 1:
        raise ValueError(f'Non-unique section markers: {start!r}, {end!r}')
    a = text.index(start)
    b = text.index(end, a)
    return text[:a] + new + text[b:]

def transform(path, text):
    if path == 'src/utils/validation.js':
        text = 'import { validateIndiaCheckout } from "./india.js";\n\n' + text
        pos = text.index('export function validateCheckout(')
        return text[:pos] + 'export const validateCheckout = (form) => validateIndiaCheckout(form);\n'
    if path == 'src/data/products.js':
        text = 'import { indiaSeed } from "../utils/india.js";\n\n' + text
        text = one(text, 'export const PRODUCTS = [', 'export const PRODUCTS = indiaSeed([')
        return one(text, '];\n\nexport const getProduct', ']);\n\nexport const getProduct')
    if path == 'server/db.js':
        text = 'import { assertIndiaDatabase, assertHostingPolicy } from "./indiaGuard.js";\n' + text
        text = one(text, 'path = "server/data/store.db"', 'path = "server/data/store-inr.db"')
        text = one(text, '  const db = new Database(path);', '''  assertHostingPolicy();
  if (process.env.NODE_ENV === "production" && (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 16 || process.env.ADMIN_PASSWORD === "admin123")) {
    throw new Error("Set a unique ADMIN_PASSWORD of at least 16 characters before production startup");
  }
  const db = new Database(path);
  try { assertIndiaDatabase(db); } catch (error) { db.close(); throw error; }''')
        return text
    if path == 'server/app.js':
        text = one(text, 'process.env.DB_PATH || "server/data/store.db"', 'process.env.DB_PATH || "server/data/store-inr.db"')
        text = one(text, '  app.use(cors());', '''  app.use((_req, res, next) => { res.setHeader("X-Nimbus-Currency", "INR"); next(); });
  app.use(cors({ exposedHeaders: ["X-Nimbus-Currency"] }));''')
        return text
    if path == 'server/auth.js':
        return between(text, 'if (!process.env.JWT_SECRET', '\nexport const signToken', '''if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === "dev-only-secret-change-me")) {
  throw new Error("Set a unique JWT_SECRET of at least 32 characters before production startup");
}
''')
    if path == 'server/routes/orders.js':
        text = 'import { checkoutTotals, canChangeOrderStatus } from "../../src/utils/india.js";\n' + text
        text = one(text, '    const form = req.body?.customer || {};', '    const form = Object.fromEntries(Object.entries(req.body?.customer || {}).map(([key, value]) => [key, String(value ?? "")]));')
        text = one(text, 'export const TAX_RATE = 0.08;', 'export const TAX_RATE = 0; // Demo prices only; not a GST calculation.')
        text = one(text, '    cardLast4: o.card_last4,', '    cardLast4: o.card_last4,\n    paymentMethod: "demo",\n    currency: "INR",')
        text = one(text, 'const qty = Math.floor(Number(l.qty));', 'const qty = Number(l.qty);')
        text = one(text, 'if (!product) throw', 'if (!product || !product.active) throw')
        text = one(text, '    if (!lines.length) return res.status(400).json({ error: "Your cart is empty" });', '''    if (!lines.length) return res.status(400).json({ error: "Your cart is empty" });
    const ids = lines.map((line) => Number(line?.id));
    if (ids.some((id) => !Number.isSafeInteger(id) || id < 1) || new Set(ids).size !== ids.length) {
      return res.status(400).json({ error: "Each product must appear once with a valid product ID" });
    }''')
        text = one(text, '''        const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
        const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;''',
            '        const { subtotal, tax, total } = checkoutTotals(items);')
        text = one(text, 'String(form.card).replace(/\\D/g, "").slice(-4)', '"DEMO"')
        text = one(text, '    if (order.status === "cancelled" && status !== "cancelled") return res.status(409).json({ error: "A cancelled order cannot be reopened" });', '''    if (!canChangeOrderStatus(order.status, status)) return res.status(409).json({ error: `Cannot move an order from ${order.status} to ${status}` });''')
        return text
    if path == 'src/api.js':
        text = one(text, '"nimbusmart:token"', '"nimbusmart-inr:token"')
        text = one(text, '  const text = await res.text();', '''  if (res.headers.get("X-Nimbus-Currency") !== "INR") {
    throw new ApiError(503, "The API is not the INR release. Deploy matching frontend and backend versions; legacy USD data will not be relabelled.");
  }
  const text = await res.text();''')
        text = one(text, '  const data = text ? JSON.parse(text) : null;', '''  let data = null;
  try { data = text ? JSON.parse(text) : null; }
  catch { throw new ApiError(res.status || 502, "The server returned an unexpected response. Please retry after checking the service status."); }''')
        return text
    if path == 'src/context/CartContext.jsx':
        text = one(text, '"nimbusmart:cart"', '"nimbusmart-inr:cart"')
        return one(text, '"nimbusmart:guest-orders"', '"nimbusmart-inr:guest-orders"')
    if path == 'src/components/FilterSidebar.jsx':
        text = between(text, 'export const PRICE_BANDS = [', '\nexport default function', '''export const PRICE_BANDS = [
  { id: "any", label: "Any price", lo: 0, hi: Infinity },
  { id: "under999", label: "Below ₹1,000", lo: 0, hi: 999.99 },
  { id: "1000to4999", label: "₹1,000 to below ₹5,000", lo: 1000, hi: 4999.99 },
  { id: "5000to9999", label: "₹5,000 to below ₹10,000", lo: 5000, hi: 9999.99 },
  { id: "over10000", label: "₹10,000 and above", lo: 10000, hi: Infinity },
];
''')
        return text.replace('Free delivery only', 'Free demo delivery only')
    if path == 'src/components/Header.jsx':
        text = text.replace('>Returns</span>', '>Your</span>').replace('>& Orders</span>', '>Orders</span>')
        # Request cancellation prevents an older suggestion response replacing newer results.
        text = one(text, '    const t = setTimeout(() => {', '    const controller = new AbortController();\n    const t = setTimeout(() => {')
        text = one(text, 'limit: 6 })}`)', 'limit: 6 })}`, { signal: controller.signal })')
        text = one(text, '.catch(() => setHints([]));', '.catch((error) => { if (error.name !== "AbortError") setHints([]); });')
        text = one(text, '    return () => clearTimeout(t);', '    return () => { clearTimeout(t); controller.abort(); };')
        return text
    if path == 'src/components/ProductCard.jsx':
        return text.replace('>Free delivery</span>', '>Free demo delivery</span>')
    if path == 'src/pages/ProductPage.jsx':
        text = between(text, '          {product.prime ? (', '          <p className="mt-1 flex items-center', '''          <p className="mt-2 text-sm text-ink"><strong>Free demo delivery</strong> · Illustrative date: {deliveryDate()}</p>
''')
        text = text.replace('Demo store. Orders are recorded but no card is charged.', 'Sample INR catalogue. No payment is collected and no goods are shipped.')
        text = text.replace('Secure transaction', 'Demo transaction · no payment')
        text = text.replace('Ships from NimbusMart', 'No physical shipment in this demo')
        text = text.replace('Returnable within 30 days', 'Cancel demo orders before shipment status')
        text = text.replace('            Buy now\n', '            Add and go to checkout\n')
        return text
    if path == 'src/pages/CartPage.jsx':
        text = text.replace('Your order qualifies for free delivery', 'Free delivery in this demo · no goods are shipped')
        return one(text, 'disabled={items.some((i) => i.pending || i.stock === 0 || i.qty > i.stock)}', 'disabled={syncing || items.some((i) => i.pending || i.stock === 0 || i.qty > i.stock)}')
    if path == 'src/pages/OrderConfirmationPage.jsx':
        text = text.replace('Order placed, thank you', 'Demo order recorded, thank you')
        text = text.replace('A confirmation would be sent to {order.email}', 'No money was collected, no shipment will occur, and no confirmation email is sent.')
        text = text.replace('>Arriving </dt>', '>Illustrative date </dt>')
        text = text.replace('>Paid with </dt><dd className="inline">card ending {order.cardLast4}</dd>', '>Payment </dt><dd className="inline">Demo only · nothing charged</dd>')
        text = text.replace('<dt>Tax</dt>', '<dt>Additional demo tax</dt>')
        text = one(text, '      <div className="bg-white p-6">', '''      {state?.addressWarning && <p role="alert" className="mb-3 rounded bg-amber-50 p-3 text-sm">{state.addressWarning}</p>}
      <div className="bg-white p-6">''')
        return text
    if path == 'src/pages/ListingPage.jsx':
        # Keep the existing layout; use the URL as the source of truth for filters/sort.
        text = one(text, '  const [params] = useSearchParams();', '  const [params, setParams] = useSearchParams();')
        text = one(text, '  const [filters, setFilters] = useState(emptyFilters);\n  const [sort, setSort] = useState("featured");', '''  const requestedBand = params.get("band") || "any";
  const filters = {
    categories: (params.has("category") ? params.get("category") : slug || "").split(",").filter(Boolean),
    band: PRICE_BANDS.some((b) => b.id === requestedBand) ? requestedBand : "any",
    minRating: Math.min(5, Math.max(0, Number(params.get("minRating")) || 0)),
    primeOnly: params.get("prime") === "1",
  };
  const sort = SORTS.some((s) => s.id === params.get("sort")) ? params.get("sort") : "featured";
  const setSort = (value) => { const next = new URLSearchParams(params); next.set("sort", value); setParams(next); };
  const setFilters = (value) => {
    const f = typeof value === "function" ? value(filters) : value;
    const next = new URLSearchParams(params);
    next.set("category", f.categories.join(","));
    next.set("band", f.band);
    next.set("minRating", String(f.minRating));
    next.set("prime", f.primeOnly ? "1" : "0");
    if (f.band !== filters.band || value === emptyFilters) { next.delete("minPrice"); next.delete("maxPrice"); }
    setParams(next);
  };
  const numberParam = (key) => {
    const raw = params.get(key);
    const n = Number(raw);
    return raw !== null && raw !== "" && Number.isFinite(n) && n >= 0 ? n : undefined;
  };''')
        text = between(text, '  // A URL change (new category or search)', '  const band = PRICE_BANDS.find', '')
        text = one(text, '    minPrice: band.lo > 0 ? band.lo : undefined,', '    minPrice: band.id === "any" ? numberParam("minPrice") : band.lo || undefined,')
        text = one(text, '    maxPrice: Number.isFinite(band.hi) ? band.hi : undefined,', '    maxPrice: band.id === "any" ? numberParam("maxPrice") : Number.isFinite(band.hi) ? band.hi : undefined,')
        # There is no real delivery restriction in this demonstration store.
        return text
    raise ValueError(f'No transformation registered for {path}')
