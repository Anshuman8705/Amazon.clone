import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { useFetch } from "../../hooks/useFetch.js";
import { api } from "../../api.js";
import { money } from "../../utils/format.js";

const STATUSES = ["confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const { data: orders, loading, error, reload } = useFetch(`/admin/orders${status ? `?status=${status}` : ""}`);
  const [msg, setMsg] = useState(null);

  const change = async (o, next) => {
    if (next === o.status) return;
    if (next === "cancelled" && !window.confirm(`Cancel order ${o.id}? Stock will be returned.`)) return;
    setMsg(null);
    try { await api(`/admin/orders/${o.id}`, { method: "PATCH", body: { status: next } }); reload(); setMsg({ ok: true, text: `Order ${o.id} marked ${next}` }); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink">Orders</h1>
        <label className="text-sm text-ink">Show
          <select value={status} onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {})} className="ml-2 rounded border border-line px-2 py-1">
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      {msg ? <p role="status" className={`mb-3 text-sm ${msg.ok ? "text-pine" : "text-crimson"}`}>{msg.text}</p> : null}
      {error ? <ErrorBox error={error} onRetry={reload} /> : null}
      {loading && !orders ? <p className="text-sm text-muted">Loading</p> : null}
      {orders && orders.length === 0 ? <p className="bg-white p-6 text-sm text-muted">No orders match.</p> : null}
      <div className="space-y-3">
        {(orders || []).map((o) => (
          <article key={o.id} className="bg-white p-4" data-testid="admin-order">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="text-sm">
                <Link to={`/order/${o.id}`} className="font-bold text-link hover:underline">{o.id}</Link>
                <p className="text-ink">{o.customer.name}{o.customer.guest ? " (guest)" : ""} · {o.customer.email}</p>
                <p className="text-muted">{o.address}</p>
                <p className="text-muted">Placed {new Date(o.placedAt.replace(" ", "T") + "Z").toLocaleString("en-US")} · card ending {o.cardLast4}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-lg font-bold text-ink">{money(o.total)}</p>
                <StatusBadge status={o.status} />
                <div className="mt-2">
                  <label className="text-xs text-muted">Set status
                    <select
                      value={o.status}
                      onChange={(e) => change(o, e.target.value)}
                      disabled={o.status === "cancelled"}
                      aria-label={`Status for order ${o.id}`}
                      className="ml-2 rounded border border-line px-2 py-1 text-sm text-ink disabled:opacity-50"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            </div>
            <ul className="mt-3 divide-y divide-line border-t border-line text-sm">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between py-1.5"><span className="text-ink">{i.title}</span><span className="text-muted">{i.qty} × {money(i.price)}</span></li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
