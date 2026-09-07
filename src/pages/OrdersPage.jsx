import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import Button from "../components/Button.jsx";
import ProductImage from "../components/ProductImage.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useUser } from "../context/UserContext.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { api } from "../api.js";
import { money } from "../utils/format.js";
import { useEffect, useState } from "react";

export default function OrdersPage() {
  const { user } = useUser();
  const { guestOrders } = useCart();
  const account = useFetch("/orders", { enabled: Boolean(user) });
  const [guest, setGuest] = useState([]);

  useEffect(() => {
    if (user || !guestOrders.length) { setGuest([]); return; }
    Promise.all(guestOrders.map((id) => api(`/orders/${id}`).catch(() => null))).then((list) => setGuest(list.filter(Boolean)));
  }, [user, guestOrders]);

  const orders = user ? account.data || [] : guest;
  const loading = user ? account.loading : false;
  const [cancelErr, setCancelErr] = useState(null);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this order? Stock will be returned and the order cannot be reopened.")) return;
    setCancelErr(null);
    try { await api(`/orders/${id}/cancel`, { method: "POST" }); account.reload(); }
    catch (e) { setCancelErr(e.message); }
  };

  return (
    <main className="mx-auto max-w-screen-md px-3 py-6">
      <h1 className="mb-4 text-2xl font-bold text-ink">Your orders</h1>
      {!user ? <p className="mb-4 text-sm text-muted">You are browsing as a guest, so only orders placed in this browser are shown. <Link to="/signin" className="text-link hover:underline">Sign in</Link> to see orders from any device.</p> : null}
      {account.error ? <ErrorBox error={account.error} onRetry={account.reload} /> : null}
      {cancelErr ? <p role="alert" className="mb-3 text-sm text-crimson">{cancelErr}</p> : null}
      {loading ? <p className="text-sm text-muted">Loading orders</p> : orders.length === 0 ? (
        <div className="bg-white p-10 text-center">
          <Package size={48} className="mx-auto text-muted" />
          <p className="mt-4 text-lg font-bold text-ink">No orders yet</p>
          <p className="mt-1 text-sm text-muted">Orders you place in this browser will be listed here.</p>
          <Link to="/products"><Button className="mt-4 px-6">Start shopping</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="bg-white" data-testid="order">
              <header className="flex flex-wrap justify-between gap-2 border-b border-line bg-gray-50 px-5 py-3 text-xs text-muted">
                <span>Order placed <span className="block text-ink">{new Date(o.placedAt.replace(" ", "T") + (o.placedAt.endsWith("Z") ? "" : "Z")).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</span></span>
                <span>Total <span className="block text-ink">{money(o.total)}</span></span>
                <span>Ship to <span className="block text-ink">{o.name}</span></span>
                <span>Order <Link to={`/order/${o.id}`} className="block text-link hover:underline">{o.id}</Link></span>
              </header>
              <div className="px-5 py-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-pine">
                    {o.status === "cancelled" ? <span className="text-muted">Cancelled</span> : o.status === "delivered" ? "Delivered" : `Arriving ${o.arrives}`}
                    <span className="ml-2"><StatusBadge status={o.status} /></span>
                  </p>
                  {user && o.status === "confirmed" ? (
                    <button type="button" onClick={() => cancel(o.id)} className="text-sm text-link hover:underline">Cancel order</button>
                  ) : null}
                </div>
                {o.items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 py-1">
                    <div className="w-14 shrink-0"><ProductImage product={i} /></div>
                    <Link to={`/product/${i.id}`} className="text-sm text-link hover:underline">{i.title}</Link>
                    <span className="ml-auto text-xs text-muted">Qty {i.qty}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
