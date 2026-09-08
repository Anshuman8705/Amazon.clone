import { CURRENCY } from "./india.js";

export function money(value, currency = CURRENCY) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency,
    currencyDisplay: currency === "INR" ? "symbol" : "code",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(number);
}

export const compact = (value) => new Intl.NumberFormat("en-IN").format(value);

// Illustrative date only. Weekends are excluded; holidays and serviceability are not modelled.
export function deliveryDate(from = new Date()) {
  const indiaDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(from));
  const part = (type) => indiaDay.find((p) => p.type === type).value;
  const d = new Date(Date.UTC(Number(part("year")), Number(part("month")) - 1, Number(part("day"))));
  for (let added = 0; added < 2;) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) added += 1;
  }
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC", weekday: "long", day: "numeric", month: "long",
  }).format(d);
}

export const orderNumber = () => `NM-${globalThis.crypto.randomUUID()}`;
