/** India-focused DEMO settings. Prices are curated sample prices, not FX conversions. */
export const CURRENCY = "INR";
export const COUNTRY = "India";
export const STATES_AND_UTS = Object.freeze([
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]);

// [sample selling price, sample comparison price], in rupees.
// These are demonstration values, not verified offers or market prices.
export const SAMPLE_PRICES = Object.freeze({
  1: [6499, 8999], 2: [62999, 79999], 3: [699, 999], 4: [2999, 3999],
  5: [7999, 11999], 6: [899, 1299], 7: [1299, 1799], 8: [8999, 12999],
  9: [499, 699], 10: [399, 599], 11: [799, 1199], 12: [349, 499],
  13: [999, 1499], 14: [1299, 1799], 15: [1499, 2499], 16: [1999, 2999],
  17: [999, 1499], 18: [1799, 2499], 19: [1799, 2499], 20: [2499, 3499],
});

export function indiaSeed(products) {
  return products.map((product) => {
    const prices = SAMPLE_PRICES[product.id];
    if (!prices) throw new Error(`Missing sample INR price for product ${product.id}`);
    return {
      ...product,
      price: prices[0], was: prices[1], prime: true,
      // Do not manufacture thousands of customer ratings in a fresh demo.
      rating: 0, reviews: 0,
      title: product.id === 15 ? "Toys and Games Gift Bundle — Sample Collection" : product.title,
    };
  });
}

export function validPin(value) {
  // Format check only. This does not establish postal serviceability.
  return /^[1-9][0-9]{5}$/.test(String(value ?? "").trim());
}

export function paise(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100000000) throw new RangeError("Invalid amount");
  return Math.round((n + Number.EPSILON) * 100);
}

export function checkoutTotals(items) {
  let subtotalPaise = 0;
  for (const item of items) {
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 10) {
      throw new RangeError("Quantity must be a whole number from 1 to 10");
    }
    subtotalPaise += paise(item.price) * item.qty;
    if (!Number.isSafeInteger(subtotalPaise)) throw new RangeError("Order total is too large");
  }
  // No real sale occurs. Do not claim this is a GST calculation or tax invoice.
  return { subtotal: subtotalPaise / 100, shipping: 0, tax: 0,
    total: subtotalPaise / 100, currency: CURRENCY };
}

export function validateIndiaCheckout(input = {}) {
  const f = Object.fromEntries(Object.entries(input ?? {}).map(([k, v]) => [k, String(v ?? "").trim()]));
  const errors = {};
  if (!f.name || f.name.length < 2 || f.name.length > 100) errors.name = "Enter a name between 2 and 100 characters";
  if (!f.email || f.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) errors.email = "Enter a valid email address";
  if (!f.address || f.address.length < 5 || f.address.length > 240) errors.address = "Enter a building and street address (5–240 characters)";
  if (!f.city || f.city.length < 2 || f.city.length > 100) errors.city = "Enter a city or town (2–100 characters)";
  if (!STATES_AND_UTS.includes(f.state)) errors.state = "Choose an Indian state or union territory";
  if (!validPin(f.zip)) errors.zip = "Enter a six-digit Indian PIN code";
  if (f.paymentMethod !== "demo") errors.paymentMethod = "Only demo payment is available";
  if (["card", "cardName", "expiry", "cvv"].some((key) => Boolean(f[key]))) {
    errors.paymentMethod = "Do not send card details. This store accepts demo payment only";
  }
  return errors;
}

export function canChangeOrderStatus(from, to) {
  const transitions = {
    confirmed: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [],
  };
  return Object.hasOwn(transitions, from) && (from === to || transitions[from].includes(to));
}
