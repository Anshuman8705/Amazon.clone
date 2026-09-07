import { Link, useLocation, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import Button from "../components/Button.jsx";
import ProductImage from "../components/ProductImage.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { money } from "../utils/format.js";

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const { data, loading, error, reload } = useFetch(`/orders/${id}`, { enabled: !state?.order });
  const order = state?.order || data;

  if (error?.status === 404) return <NotFoundPage message="We could not find that order." />;
  if (error) return <main className="mx-auto max-w-screen-md px-3 py-6"><ErrorBox error={error} onRetry={reload} /></main>;
  if (loading || !order) return <main className="mx-auto max-w-screen-md px-3 py-6"><p className="text-sm text-muted">Loading order</p></main>;

  return (
    <main className="mx-auto max-w-screen-md px-3 py-6">
      <div className="bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine">
            <Check size={22} color="#fff" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-pine">Order placed, thank you</h1>
            <p className="text-sm text-muted">A confirmation would be sent to {order.email}</p>
          </div>
        </div>

        <dl className="mt-4 grid gap-1 text-sm text-ink sm:grid-cols-2">
          <div><dt className="inline text-muted">Order number </dt><dd className="inline font-bold" data-testid="order-id">{order.id}</dd></div>
          <div><dt className="inline text-muted">Arriving </dt><dd className="inline font-bold">{order.arrives}</dd></div>
          <div className="sm:col-span-2"><dt className="inline text-muted">Delivering to </dt><dd className="inline">{order.name}, {order.address}</dd></div>
          <div><dt className="inline text-muted">Paid with </dt><dd className="inline">card ending {order.cardLast4}</dd></div>
          <div><dt className="inline text-muted">Status </dt><dd className="inline"><StatusBadge status={order.status} /></dd></div>
        </dl>

        <div className="mt-4 divide-y divide-line border-t border-line">
          {order.items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 py-3">
              <div className="w-16 shrink-0"><ProductImage product={i} /></div>
              <Link to={`/product/${i.id}`} className="min-w-0 flex-1 text-sm text-ink hover:underline">{i.title}</Link>
              <span className="text-sm text-muted">Qty {i.qty}</span>
              <span className="text-sm font-medium text-ink">{money(i.price * i.qty)}</span>
            </div>
          ))}
        </div>

        <dl className="mt-3 ml-auto w-48 space-y-1 text-sm text-ink">
          <div className="flex justify-between"><dt>Items</dt><dd>{money(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Tax</dt><dd>{money(order.tax)}</dd></div>
          <div className="flex justify-between border-t border-line pt-1 text-base font-bold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/"><Button variant="ghost">Continue shopping</Button></Link>
          <Link to="/orders"><Button variant="ghost">View all orders</Button></Link>
        </div>
      </div>
    </main>
  );
}
