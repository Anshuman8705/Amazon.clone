// Luhn checksum. Every real card number passes this, most typos do not.
export function luhn(value) {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

export function formatCardNumber(raw) {
  const digits = String(raw).replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(raw) {
  const digits = String(raw).replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function expiryError(value, now = new Date()) {
  const m = String(value).match(/^(\d{2})\/(\d{2})$/);
  if (!m) return "Use MM/YY";
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return "Month must be 01 to 12";
  const lastDay = new Date(year, month, 0, 23, 59, 59);
  if (lastDay < now) return "That card has expired";
  return "";
}

export function validateCheckout(f, now = new Date()) {
  const err = {};
  if (f.name.trim().length < 2) err.name = "Enter the name for the delivery address";
  if (!isEmail(f.email)) err.email = "Enter a valid email address";
  if (f.address.trim().length < 5) err.address = "Enter a street address";
  if (!f.city.trim()) err.city = "Enter a city";
  if (!f.state.trim()) err.state = "Enter a state";
  if (!/^\d{5,6}$/.test(f.zip.trim())) err.zip = "Enter a 5 or 6 digit postal code";
  if (f.cardName.trim().length < 2) err.cardName = "Enter the name printed on the card";
  if (!luhn(f.card)) err.card = "That card number fails the checksum. Try 4242 4242 4242 4242";
  const e = expiryError(f.expiry, now);
  if (e) err.expiry = e;
  if (!/^\d{3,4}$/.test(f.cvv)) err.cvv = "Enter the 3 or 4 digit code on the card";
  return err;
}
