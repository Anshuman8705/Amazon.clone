import { Link } from "react-router-dom";
import ErrorBox from "../../components/ErrorBox.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { useFetch } from "../../hooks/useFetch.js";
import { money } from "../../utils/format.js";

function Stat({ label, value, to }) {
  const body = (
    <>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </>
  );
  return to ? <Link to={to} className="block rounded border border-line bg-white p-4 hover:bg-gray-50">{body}</Link> : <div className="rounded border border-line bg-white p-4">{body}</div>;
}

export default function AdminDashboard() {
  const { data: s, loading, error, reload } = useFetch("/admin/stats");
  const { data: recent } = useFetch("/admin/orders");
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (loading || !s) return <p className="text-sm text-muted">Loading</p>;
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-ink">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue (excluding cancelled)" value={money(s.revenue)} />
        <Stat label="Orders" value={s.orders} to="/admin/orders" />
        <Stat label="Open orders (confirmed or shipped)" value={s.openOrders} to="/admin/orders?status=confirmed" />
        <Stat label="Customers" value={s.customers} to="/admin/customers" />
        <Stat label="Active products" value={s.products} to="/admin/products" />
        <Stat label="Low stock (5 or fewer)" value={s.lowStock} to="/admin/products?lowStock=1" />
        <Stat label="Reviews written" value={s.reviews} />
        <Stat label="Cancelled orders" value={s.byStatus.cancelled || 0} to="/admin/orders?status=cancelled" />
      </div>

      <section className="mt-4 bg-white p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-bold text-ink">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm text-link hover:underline">All orders</Link>
        </div>
        {recent && recent.length === 0 ? <p className="text-sm text-muted">No orders yet.</p> : null}
        <ul className="divide-y divide-line">
          {(recent || []).slice(0, 6).map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <Link to={`/order/${o.id}`} className="text-link hover:underline">{o.id}</Link>
              <span className="text-ink">{o.customer.name}{o.customer.guest ? " (guest)" : ""}</span>
              <span className="text-ink">{money(o.total)}</span>
              <StatusBadge status={o.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
