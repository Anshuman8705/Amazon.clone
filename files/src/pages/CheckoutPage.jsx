import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import { Field, TextInput } from "../components/Field.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useUser } from "../context/UserContext.jsx";
import { money } from "../utils/format.js";
import { STATES_AND_UTS, checkoutTotals, validateIndiaCheckout } from "../utils/india.js";
import { api } from "../api.js";

const blank = { name: "", email: "", address: "", city: "", state: "", zip: "", paymentMethod: "demo" };
const fieldOrder = ["name", "email", "address", "city", "state", "zip"];

export default function CheckoutPage() {
  const { items, placeOrder, syncing } = useCart();
  const { user, ready } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const dirty = useRef(false);
  const root = useRef(null);
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email }));
  }, [user?.id]);

  useEffect(() => {
    let live = true;
    setAddresses([]);
    if (user) api("/account/addresses").then((list) => {
      if (!live) return;
      setAddresses(list);
      const def = list.find((a) => a.isDefault);
      if (def && !dirty.current) {
        setSelected(String(def.id));
        setForm((f) => ({ ...f, name: def.name, address: def.line1, city: def.city, state: def.state, zip: def.zip }));
      }
    }).catch(() => { if (live) setError("Saved addresses could not be loaded. You can enter a demo address below."); });
    return () => { live = false; };
  }, [user?.id]);

  function update(key, value) {
    dirty.current = true;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function selectAddress(id) {
    setSelected(id);
    dirty.current = true;
    const a = addresses.find((row) => String(row.id) === id);
    setForm((f) => a
      ? { ...f, name: a.name, address: a.line1, city: a.city, state: a.state, zip: a.zip }
      : { ...f, address: "", city: "", state: "", zip: "" });
  }

  const blocked = !ready || syncing || items.some((i) => i.pending || i.qty > i.stock || i.stock < 1);
  let totals = { subtotal: 0, shipping: 0, tax: 0, total: 0 };
  if (!blocked) totals = checkoutTotals(items);

  async function submit(event) {
    event.preventDefault();
    if (submitLock.current || blocked) return;
    const next = validateIndiaCheckout(form);
    setErrors(next);
    setError("");
    if (Object.keys(next).length) {
      // Focus after React has committed the error attributes and associated text.
      requestAnimationFrame(() => root.current?.querySelector(`[id="${fieldOrder.find((k) => next[k])}"]`)?.focus());
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    try {
      // No real card data is collected or transmitted.
      const order = await placeOrder({ ...form, paymentMethod: "demo" });
      let addressWarning = "";
      if (user && saveAddress && !selected) {
        try {
          await api("/account/addresses", { method: "POST", body: {
            label: "Home", name: form.name, line1: form.address,
            city: form.city, state: form.state, zip: form.zip,
          } });
        } catch { addressWarning = "The order was recorded, but your address was not saved to your address book."; }
      }
      navigate(`/order/${order.id}`, { state: { order, addressWarning } });
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      setError(err.message || "The order could not be confirmed. Check your order history before trying again.");
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  if (!ready || syncing) return <main className="mx-auto max-w-screen-lg p-6" role="status">Loading your cart and account…</main>;
  if (!items.length && !submitting) return <Navigate to="/cart" replace />;

  return (
    <main ref={root} className="mx-auto max-w-screen-lg px-3 py-6">
      <div className="mb-4 rounded border border-line bg-amber-50 p-4 text-sm" role="note">
        <strong>Demonstration checkout.</strong> No payment is taken and no goods are shipped.
        Use fictional contact and address details. Your demo order updates sample inventory.
      </div>
      {error && <div role="alert" className="mb-4 rounded border border-crimson bg-red-50 p-3">{error}</div>}
      {blocked && <p role="alert" className="mb-4 text-crimson">Some items are loading or unavailable. <Link to="/cart" className="underline">Review your cart</Link> before continuing.</p>}
      <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="rounded-lg bg-white p-5">
          <h1 className="text-2xl font-bold text-ink">Demo checkout</h1>
          <h2 className="mt-5 border-b border-line pb-2 text-lg font-bold">Indian delivery address</h2>
          {addresses.length > 0 && <label className="mt-3 block text-sm">Saved address
            <select value={selected} onChange={(e) => selectAddress(e.target.value)} className="mt-1 block w-full rounded border border-line p-2">
              <option value="">Enter a new address</option>
              {addresses.map((a) => <option key={a.id} value={a.id}>{a.label}: {a.line1}, {a.city}</option>)}
            </select>
          </label>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Full name" error={errors.name}><TextInput id="name" value={form.name} onChange={(e) => update("name", e.target.value)} error={errors.name} maxLength={100} autoComplete="off" /></Field>
            <Field id="email" label="Email" error={errors.email}><TextInput id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} error={errors.email} maxLength={254} autoComplete="off" /></Field>
            <div className="sm:col-span-2"><Field id="address" label="Building and street address" error={errors.address}><TextInput id="address" value={form.address} onChange={(e) => update("address", e.target.value)} error={errors.address} maxLength={240} autoComplete="off" /></Field></div>
            <Field id="city" label="City or town" error={errors.city}><TextInput id="city" value={form.city} onChange={(e) => update("city", e.target.value)} error={errors.city} maxLength={100} autoComplete="off" /></Field>
            <Field id="state" label="State / union territory" error={errors.state}>
              <select id="state" value={form.state} onChange={(e) => update("state", e.target.value)} aria-invalid={errors.state ? "true" : undefined} aria-describedby={errors.state ? "state-error" : undefined} className="block w-full rounded border border-line bg-white px-3 py-2">
                <option value="">Choose a state / union territory</option>
                {STATES_AND_UTS.map((state) => <option key={state}>{state}</option>)}
              </select>
            </Field>
            <Field id="zip" label="PIN code" error={errors.zip}><TextInput id="zip" inputMode="numeric" value={form.zip} onChange={(e) => update("zip", e.target.value.replace(/\D/g, "").slice(0, 6))} error={errors.zip} maxLength={6} autoComplete="off" /></Field>
            <div><p className="text-sm font-medium">Country</p><p className="mt-2">India</p></div>
          </div>
          {user && !selected && <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} /> Save this demo address to my account</label>}
          <h2 className="mt-6 border-b border-line pb-2 text-lg font-bold">Payment</h2>
          <p className="mt-3 rounded bg-gray-50 p-3 text-sm"><strong>Demo payment — ₹0 charged.</strong> No card number, CVV, UPI PIN, or bank information is needed.</p>
          {errors.paymentMethod && <p role="alert" className="mt-2 text-sm text-crimson">{errors.paymentMethod}</p>}
        </section>
        <aside className="h-fit rounded-lg bg-white p-5">
          <h2 className="text-lg font-bold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Sample items</dt><dd>{blocked ? "—" : money(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Demo delivery</dt><dd>Free</dd></div>
            <div className="flex justify-between"><dt>Additional tax</dt><dd>{money(0)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>Demo total</dt><dd data-testid="order-total">{blocked ? "—" : money(totals.total)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-muted">Sample INR prices only. No real sale occurs; this is not a GST calculation or a tax invoice.</p>
          <Button type="submit" disabled={blocked || submitting} className="mt-4 w-full">{submitting ? "Recording demo order…" : "Place demo order"}</Button>
          <Link to="/cart" className="mt-3 block text-center text-sm text-link hover:underline">Back to cart</Link>
        </aside>
      </form>
    </main>
  );
}
