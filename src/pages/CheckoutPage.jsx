import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Button from "../components/Button.jsx";
import { Field, TextInput } from "../components/Field.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useUser } from "../context/UserContext.jsx";
import { money } from "../utils/format.js";
import { api } from "../api.js";
import { validateCheckout, formatCardNumber, formatExpiry } from "../utils/validation.js";

const TAX_RATE = 0.08;

export default function CheckoutPage() {
  const { items, subtotal, placeOrder } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardName: "",
    card: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  // The account may finish loading after this page mounts (direct link or
  // refresh), so fill in name and email once it does, without overwriting typing.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email }));
  }, [user]);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [chosen, setChosen] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);

  const applyAddress = (a) => {
    setChosen(String(a.id));
    setForm((f) => ({ ...f, name: a.name, address: a.line1, city: a.city, state: a.state, zip: a.zip }));
  };

  // Saved addresses fill the form; the default one is applied automatically.
  useEffect(() => {
    if (!user) return;
    api("/account/addresses").then((list) => {
      setAddresses(list);
      const def = list.find((a) => a.isDefault);
      if (def) applyAddress(def);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!items.length) return <Navigate to="/cart" replace />;

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const set = (key, transform = (v) => v) => (e) => setForm((f) => ({ ...f, [key]: transform(e.target.value) }));

  const submit = async (e) => {
    e.preventDefault();
    setServerError(null);
    const err = validateCheckout(form);
    setErrors(err);
    if (Object.keys(err).length) {
      const first = document.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    setSubmitting(true);
    try {
      const order = await placeOrder(form);
      if (user && saveAddress) {
        await api("/account/addresses", { method: "POST", body: { label: "Home", name: form.name, line1: form.address, city: form.city, state: form.state, zip: form.zip } }).catch(() => {});
      }
      navigate(`/order/${order.id}`, { state: { order } });
    } catch (apiErr) {
      if (apiErr.fields && Object.keys(apiErr.fields).length) setErrors(apiErr.fields);
      setServerError(apiErr);
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <main className="mx-auto max-w-screen-lg px-3 py-6">
      <div className="mb-4 flex items-start gap-3 rounded border border-line bg-amber-50 p-3" role="note">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ink" />
        <p className="text-sm text-ink">
          This is a demonstration checkout. Your order is recorded on the server and stock is
          updated, but no card is charged. Use a test number such as 4242 4242 4242 4242 with any
          future expiry date.
        </p>
      </div>

      {serverError ? (
        <div role="alert" className="mb-4 rounded border border-crimson bg-red-50 p-3 text-sm text-ink">
          <p className="font-bold">{serverError.message}</p>
          {serverError.status === 409 ? (
            <p className="mt-1">Stock changed while you were shopping. <Link to="/cart" className="text-link hover:underline">Go back to your cart</Link> to adjust it.</p>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="bg-white p-5">
          <h1 className="text-2xl font-bold text-ink">Checkout</h1>

          <h2 className="mt-5 border-b border-line pb-2 text-lg font-bold text-ink">Delivery address</h2>
          {addresses.length ? (
            <label className="mt-3 block text-sm text-ink">
              Use a saved address
              <select
                value={chosen}
                onChange={(e) => { const a = addresses.find((x) => String(x.id) === e.target.value); if (a) applyAddress(a); else setChosen(""); }}
                className="ml-2 rounded border border-line px-2 py-1"
                aria-label="Saved addresses"
              >
                <option value="">Enter a new address</option>
                {addresses.map((a) => <option key={a.id} value={a.id}>{a.label}: {a.line1}, {a.city}</option>)}
              </select>
            </label>
          ) : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Full name" id="name" error={errors.name}>
              <TextInput id="name" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
            </Field>
            <Field label="Email" id="email" error={errors.email}>
              <TextInput id="email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Street address" id="address" error={errors.address}>
                <TextInput id="address" value={form.address} onChange={set("address")} error={errors.address} autoComplete="street-address" />
              </Field>
            </div>
            <Field label="City" id="city" error={errors.city}>
              <TextInput id="city" value={form.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="State" id="state" error={errors.state}>
                <TextInput id="state" value={form.state} onChange={set("state")} error={errors.state} autoComplete="address-level1" />
              </Field>
              <Field label="Postal code" id="zip" error={errors.zip}>
                <TextInput id="zip" inputMode="numeric" value={form.zip} onChange={set("zip")} error={errors.zip} autoComplete="postal-code" />
              </Field>
            </div>
          </div>

          {user && !chosen ? (
            <label className="mt-3 flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} /> Save this address to my account</label>
          ) : null}

          <h2 className="mt-6 border-b border-line pb-2 text-lg font-bold text-ink">Payment</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Name on card" id="cardName" error={errors.cardName}>
                <TextInput id="cardName" value={form.cardName} onChange={set("cardName")} error={errors.cardName} autoComplete="cc-name" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Card number" id="card" error={errors.card}>
                <TextInput id="card" inputMode="numeric" placeholder="4242 4242 4242 4242" value={form.card} onChange={set("card", formatCardNumber)} error={errors.card} autoComplete="cc-number" />
              </Field>
            </div>
            <Field label="Expiry" id="expiry" error={errors.expiry}>
              <TextInput id="expiry" inputMode="numeric" placeholder="MM/YY" value={form.expiry} onChange={set("expiry", formatExpiry)} error={errors.expiry} autoComplete="cc-exp" />
            </Field>
            <Field label="Security code" id="cvv" error={errors.cvv}>
              <TextInput id="cvv" inputMode="numeric" placeholder="123" value={form.cvv} onChange={set("cvv", (v) => v.replace(/\D/g, "").slice(0, 4))} error={errors.cvv} autoComplete="cc-csc" />
            </Field>
          </div>
        </section>

        <aside className="h-fit bg-white p-5">
          <h2 className="font-bold text-ink">Order summary</h2>
          <dl className="mt-3 space-y-1 text-sm text-ink">
            <div className="flex justify-between"><dt>Items ({items.reduce((s, i) => s + i.qty, 0)})</dt><dd>{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd className="text-pine">Free</dd></div>
            <div className="flex justify-between"><dt>Estimated tax (8%)</dt><dd>{money(tax)}</dd></div>
          </dl>
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-bold text-crimson">
            <span>Order total</span><span data-testid="order-total">{money(total)}</span>
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={submitting}>
            {submitting ? "Placing your order" : "Place your order"}
          </Button>
          <Link to="/cart" className="mt-3 flex items-center gap-1 text-sm text-link hover:underline">
            <ArrowLeft size={14} /> Back to cart
          </Link>
        </aside>
      </form>
    </main>
  );
}
