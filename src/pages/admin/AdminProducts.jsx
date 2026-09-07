import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Button from "../../components/Button.jsx";
import ErrorBox from "../../components/ErrorBox.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import { Field, TextInput } from "../../components/Field.jsx";
import { CATEGORIES } from "../../data/products.js";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../api.js";
import { money } from "../../utils/format.js";

const IMAGES = ["drill", "phone", "phone-case", "kettlebell", "armchair", "carafe", "serving-board", "desk", "hanger", "travel-kit", "makeup", "body-wash", "plush", "play-set", "pets", "fashion", "gifts"];

export function AdminProductList() {
  const [params] = useSearchParams();
  const lowStock = params.get("lowStock") === "1";
  const [q, setQ] = useState("");
  const { data, loading, error, reload } = useFetch(`/admin/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  const [msg, setMsg] = useState(null);
  const rows = (data || []).filter((p) => !lowStock || p.stock <= 5);

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"? If it has been ordered before it will be archived instead so order history stays intact.`)) return;
    try { const r = await api(`/admin/products/${p.id}`, { method: "DELETE" }); setMsg({ ok: true, text: r.archived ? "Product archived (it appears in past orders)" : "Product deleted" }); reload(); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
  };

  const quickStock = async (p, stock) => {
    try { await api(`/admin/products/${p.id}`, { method: "PATCH", body: { stock } }); reload(); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink">Products {lowStock ? <span className="text-base font-normal text-muted">(low stock)</span> : null}</h1>
        <div className="flex items-center gap-2">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name or brand" aria-label="Filter products" className="rounded border border-line px-3 py-1.5 text-sm" />
          <Link to="/admin/products/new"><Button className="flex items-center gap-1"><Plus size={16} /> Add product</Button></Link>
        </div>
      </div>
      {msg ? <p role="status" className={`mb-3 text-sm ${msg.ok ? "text-pine" : "text-crimson"}`}>{msg.text}</p> : null}
      {error ? <ErrorBox error={error} onRetry={reload} /> : null}
      {loading && !data ? <p className="text-sm text-muted">Loading</p> : null}
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Stock</th><th className="p-3">Rating</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id} data-testid="admin-product" className={p.active ? "" : "opacity-60"}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 shrink-0"><ProductImage product={p} /></div>
                    <div><Link to={`/product/${p.id}`} className="text-ink hover:underline">{p.title}</Link><p className="text-xs text-muted">{p.brand} · #{p.id}</p></div>
                  </div>
                </td>
                <td className="p-3 text-ink">{CATEGORIES.find((c) => c.slug === p.category)?.name || p.category}</td>
                <td className="p-3 text-right text-ink">{money(p.price)}<span className="block text-xs text-muted line-through">{money(p.was)}</span></td>
                <td className="p-3 text-right">
                  <input
                    type="number"
                    min="0"
                    defaultValue={p.stock}
                    key={`${p.id}-${p.stock}`}
                    onBlur={(e) => Number(e.target.value) !== p.stock && quickStock(p, Number(e.target.value))}
                    aria-label={`Stock for ${p.title}`}
                    className={`w-20 rounded border px-2 py-1 text-right ${p.stock <= 5 ? "border-crimson text-crimson" : "border-line text-ink"}`}
                  />
                </td>
                <td className="whitespace-nowrap p-3 text-ink">{p.rating.toFixed(1)} <span className="text-xs text-muted">({p.reviews.toLocaleString()})</span></td>
                <td className="p-3">{p.active ? <span className="text-xs font-bold text-pine">Live</span> : <span className="text-xs font-bold text-muted">Archived</span>}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/products/${p.id}`} className="rounded border border-line p-1.5 hover:bg-gray-50" aria-label={`Edit ${p.title}`}><Pencil size={14} /></Link>
                    <button type="button" onClick={() => remove(p)} className="rounded border border-line p-1.5 hover:bg-gray-50" aria-label={`Delete ${p.title}`}><Trash2 size={14} className="text-crimson" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && rows.length === 0 ? <p className="p-6 text-sm text-muted">No products match.</p> : null}
      </div>
    </div>
  );
}

const blank = { title: "", brand: "", category: "home", price: "", was: "", stock: "", prime: true, active: true, image: "", bullets: "" };

export function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = id && id !== "new";
  const [f, setF] = useState(blank);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    if (!editing) { setF(blank); return; }
    api(`/products/${id}`)
      .then((p) => setF({ title: p.title, brand: p.brand, category: p.category, price: String(p.price), was: String(p.was), stock: String(p.stock), prime: p.prime, active: p.active, image: p.image || "", bullets: p.bullets.join("\n") }))
      .catch(setLoadErr);
  }, [id, editing]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const body = { ...f, price: Number(f.price), was: Number(f.was || f.price), stock: Number(f.stock), image: f.image || null, bullets: f.bullets };
      const saved = editing
        ? await api(`/admin/products/${id}`, { method: "PATCH", body })
        : await api("/admin/products", { method: "POST", body });
      navigate("/admin/products", { state: { saved: saved.id } });
    } catch (err) {
      setErrors(err.fields && Object.keys(err.fields).length ? err.fields : { title: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (loadErr) return <ErrorBox error={loadErr} />;
  const preview = { title: f.title || "Preview", image: f.image || null, art: "bowl" };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-ink">{editing ? "Edit product" : "Add product"}</h1>
      <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3 bg-white p-5">
          <Field label="Title" id="p-title" error={errors.title}><TextInput id="p-title" value={f.title} onChange={set("title")} error={errors.title} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Brand" id="p-brand" error={errors.brand}><TextInput id="p-brand" value={f.brand} onChange={set("brand")} error={errors.brand} /></Field>
            <Field label="Category" id="p-category" error={errors.category}>
              <select id="p-category" value={f.category} onChange={set("category")} className="w-full rounded border border-line px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Sale price ($)" id="p-price" error={errors.price}><TextInput id="p-price" type="number" step="0.01" min="0.01" value={f.price} onChange={set("price")} error={errors.price} /></Field>
            <Field label="List price ($)" id="p-was" error={errors.was}><TextInput id="p-was" type="number" step="0.01" min="0.01" value={f.was} onChange={set("was")} error={errors.was} placeholder="Same as sale price" /></Field>
            <Field label="Stock" id="p-stock" error={errors.stock}><TextInput id="p-stock" type="number" step="1" min="0" value={f.stock} onChange={set("stock")} error={errors.stock} /></Field>
          </div>
          <Field label="Image" id="p-image" error={errors.image}>
            <div className="flex gap-2">
              <select id="p-image" value={IMAGES.includes(f.image.replace(/^\/images\/|\.jpg$/g, "")) ? f.image : ""} onChange={(e) => setF({ ...f, image: e.target.value })} className="rounded border border-line px-3 py-2 text-sm">
                <option value="">None (illustration)</option>
                {IMAGES.map((n) => <option key={n} value={`/images/${n}.jpg`}>{n}</option>)}
              </select>
              <TextInput value={f.image} onChange={set("image")} placeholder="/images/name.jpg or https://…" aria-label="Image path or URL" />
            </div>
          </Field>
          <Field label="Bullet points (one per line)" id="p-bullets" error={errors.bullets}>
            <textarea id="p-bullets" value={f.bullets} onChange={set("bullets")} rows={5} className="w-full rounded border border-line px-3 py-2 text-sm" />
          </Field>
          <div className="flex flex-wrap gap-6 text-sm text-ink">
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.prime} onChange={set("prime")} /> Free delivery</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.active} onChange={set("active")} /> Visible in the store</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving" : editing ? "Save changes" : "Create product"}</Button>
            <Link to="/admin/products"><Button variant="ghost">Cancel</Button></Link>
          </div>
        </div>
        <aside className="h-fit bg-white p-4">
          <p className="mb-2 text-xs text-muted">Preview</p>
          <ProductImage product={preview} />
          <p className="mt-2 line-clamp-2 text-sm text-ink">{f.title || "Product title"}</p>
          <p className="text-lg text-ink">{f.price ? money(Number(f.price)) : "$0.00"} {f.was && Number(f.was) > Number(f.price) ? <s className="text-xs text-muted">{money(Number(f.was))}</s> : null}</p>
          <p className="mt-3 text-xs text-muted">To use your own photo, drop a JPG into <code>public/images</code> and enter <code>/images/yourfile.jpg</code>, or paste a full https URL.</p>
        </aside>
      </form>
    </div>
  );
}
