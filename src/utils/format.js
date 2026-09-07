export const money = (n) => `$${Number(n).toFixed(2)}`;

export const compact = (n) => new Intl.NumberFormat("en-US").format(n);

// Delivery date shown across the site: two business days from now.
export function deliveryDate(from = new Date()) {
  const d = new Date(from);
  let added = 0;
  while (added < 2) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added += 1;
  }
  return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

export const orderNumber = () =>
  `402-${Math.floor(1000000 + Math.random() * 8999999)}-${Math.floor(1000000 + Math.random() * 8999999)}`;
