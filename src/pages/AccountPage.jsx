import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Package, Heart, MapPin, KeyRound, Shield } from "lucide-react";
import Button from "../components/Button.jsx";
import { Field, TextInput } from "../components/Field.jsx";
import { useUser } from "../context/UserContext.jsx";
import { api } from "../api.js";

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="bg-white p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Icon size={18} /> {title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function AddressForm({ onSaved, submitLabel = "Save address" }) {
  const [f, setF] = useState({ label: "Home", name: "", line1: "", city: "", state: "", zip: "", isDefault: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const list = await api("/account/addresses", { method: "POST", body: f });
      setF({ label: "Home", name: "", line1: "", city: "", state: "", zip: "", isDefault: false });
      onSaved?.(list);
    } catch (err) {
      setErrors(err.fields && Object.keys(err.fields).length ? err.fields : { line1: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
      <Field label="Label" id="addr-label"><TextInput id="addr-label" value={f.label} onChange={set("label")} placeholder="Home, Office" /></Field>
      <Field label="Full name" id="addr-name" error={errors.name}><TextInput id="addr-name" value={f.name} onChange={set("name")} error={errors.name} /></Field>
      <div className="sm:col-span-2"><Field label="Street address" id="addr-line1" error={errors.line1}><TextInput id="addr-line1" value={f.line1} onChange={set("line1")} error={errors.line1} /></Field></div>
      <Field label="City" id="addr-city" error={errors.city}><TextInput id="addr-city" value={f.city} onChange={set("city")} error={errors.city} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="State" id="addr-state" error={errors.state}><TextInput id="addr-state" value={f.state} onChange={set("state")} error={errors.state} /></Field>
        <Field label="Postal code" id="addr-zip" error={errors.zip}><TextInput id="addr-zip" inputMode="numeric" value={f.zip} onChange={set("zip")} error={errors.zip} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2"><input type="checkbox" checked={f.isDefault} onChange={set("isDefault")} /> Make this my default address</label>
      <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Saving" : submitLabel}</Button></div>
    </form>
  );
}

export default function AccountPage() {
  const { user, ready, updateName } = useUser();
  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState(null);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwErr, setPwErr] = useState({});
  const [pwMsg, setPwMsg] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { if (user) { setName(user.name); api("/account/addresses").then(setAddresses).catch(() => {}); } }, [user]);

  if (ready && !user) return <Navigate to="/signin" state={{ from: "/account" }} replace />;
  if (!user) return null;

  const saveName = async (e) => {
    e.preventDefault();
    setNameMsg(null);
    try { await updateName(name); setNameMsg({ ok: true, text: "Name updated" }); }
    catch (err) { setNameMsg({ ok: false, text: err.fields?.name || err.message }); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwErr({});
    setPwMsg(null);
    try {
      await api("/account/password", { method: "POST", body: pw });
      setPw({ current: "", next: "" });
      setPwMsg("Password changed");
    } catch (err) { setPwErr(err.fields || { current: err.message }); }
  };

  return (
    <main className="mx-auto max-w-screen-lg px-3 py-6">
      <h1 className="mb-4 text-2xl font-bold text-ink">Your account</h1>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Link to="/orders" className="flex items-center gap-3 rounded border border-line bg-white p-4 hover:bg-gray-50"><Package className="text-link" /> <span><span className="block font-bold text-ink">Your orders</span><span className="text-xs text-muted">Track, cancel, reorder</span></span></Link>
        <Link to="/wishlist" className="flex items-center gap-3 rounded border border-line bg-white p-4 hover:bg-gray-50"><Heart className="text-link" /> <span><span className="block font-bold text-ink">Your wishlist</span><span className="text-xs text-muted">Saved for later</span></span></Link>
        {user.role === "admin" ? (
          <Link to="/admin" className="flex items-center gap-3 rounded border border-line bg-white p-4 hover:bg-gray-50"><Shield className="text-link" /> <span><span className="block font-bold text-ink">Store admin</span><span className="text-xs text-muted">Products, orders, customers</span></span></Link>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profile" icon={KeyRound}>
          <form onSubmit={saveName} noValidate className="space-y-3">
            <Field label="Name" id="acct-name"><TextInput id="acct-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <p className="text-sm text-muted">Signed in as {user.email}{user.role === "admin" ? " (administrator)" : ""}</p>
            <Button type="submit">Save name</Button>
            {nameMsg ? <p role="status" className={`text-sm ${nameMsg.ok ? "text-pine" : "text-crimson"}`}>{nameMsg.text}</p> : null}
          </form>
          <form onSubmit={savePassword} noValidate className="mt-6 space-y-3 border-t border-line pt-4">
            <h3 className="font-bold text-ink">Change password</h3>
            <Field label="Current password" id="pw-current" error={pwErr.current}><TextInput id="pw-current" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} error={pwErr.current} autoComplete="current-password" /></Field>
            <Field label="New password" id="pw-next" error={pwErr.next}><TextInput id="pw-next" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} error={pwErr.next} autoComplete="new-password" /></Field>
            <Button type="submit" variant="ghost">Change password</Button>
            {pwMsg ? <p role="status" className="text-sm text-pine">{pwMsg}</p> : null}
          </form>
        </Panel>

        <Panel title="Addresses" icon={MapPin}>
          {addresses.length === 0 ? <p className="text-sm text-muted">No saved addresses. Add one and checkout will fill it in for you.</p> : null}
          <ul className="divide-y divide-line" data-testid="address-list">
            {addresses.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div className="text-sm text-ink">
                  <p className="font-bold">{a.label} {a.isDefault ? <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-muted">Default</span> : null}</p>
                  <p>{a.name}</p>
                  <p>{a.line1}, {a.city}, {a.state} {a.zip}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
                  {!a.isDefault ? <button type="button" className="text-link hover:underline" onClick={async () => setAddresses(await api(`/account/addresses/${a.id}/default`, { method: "POST" }))}>Set as default</button> : null}
                  <button type="button" className="text-link hover:underline" onClick={async () => setAddresses(await api(`/account/addresses/${a.id}`, { method: "DELETE" }))}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
          {showForm ? (
            <div className="mt-3 border-t border-line pt-4"><AddressForm onSaved={(list) => { setAddresses(list); setShowForm(false); }} /></div>
          ) : (
            <Button variant="ghost" className="mt-3" onClick={() => setShowForm(true)}>Add an address</Button>
          )}
        </Panel>
      </div>
    </main>
  );
}
