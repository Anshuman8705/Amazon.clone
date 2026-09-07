import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Plus, Minus, Trash2, Check } from "lucide-react";
import Button from "../components/Button.jsx";
import Price from "../components/Price.jsx";
import ProductImage from "../components/ProductImage.jsx";
import { useCart, MAX_QTY } from "../context/CartContext.jsx";
import { money } from "../utils/format.js";

export default function CartPage() {
  const { items, subtotal, count, setQty, remove, clear, syncing } = useCart();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <main className="mx-auto max-w-site px-3 py-4">
        <div className="bg-white p-10 text-center">
          <ShoppingCart size={48} className="mx-auto text-muted" />
          <h1 className="mt-4 text-2xl font-bold text-ink">Your cart is empty</h1>
          <p className="mt-1 text-sm text-muted">Add something from today's deals and it will show up here.</p>
          <Link to="/deals"><Button className="mt-4 px-6">Shop the deals</Button></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-site px-3 py-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <section className="bg-white p-5" aria-labelledby="cart-heading">
          <div className="flex items-baseline justify-between">
            <h1 id="cart-heading" className="text-2xl font-bold text-ink">Shopping cart</h1>
            <div className="flex items-center gap-3">
              {syncing ? <span className="text-xs text-muted">Syncing with your account</span> : null}
              <button type="button" onClick={clear} className="text-sm text-link hover:underline">Remove all items</button>
            </div>
          </div>
          <p className="border-b border-line pb-2 text-right text-sm text-muted">Price</p>

          {items.map((i) => (
            <div key={i.id} className="flex gap-4 border-b border-line py-4" data-testid="cart-line">
              <Link to={`/product/${i.id}`} className="w-28 shrink-0 rounded sm:w-36">
                <ProductImage product={i} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/product/${i.id}`} className="text-base text-ink hover:underline">{i.pending ? "Loading item" : i.title}</Link>
                {i.pending ? null : i.stock === 0 ? (
                  <p className="mt-1 text-xs text-crimson">Out of stock. Remove it to check out.</p>
                ) : i.qty > i.stock ? (
                  <p className="mt-1 text-xs text-crimson">Only {i.stock} available. Reduce the quantity to check out.</p>
                ) : (
                  <p className="mt-1 text-xs text-pine">In stock</p>
                )}
                {i.pending ? null : <p className="text-xs text-muted">Sold by {i.brand}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded-full border border-line" role="group" aria-label={`Quantity for ${i.title}`}>
                    <button
                      type="button"
                      onClick={() => setQty(i.id, i.qty - 1)}
                      className="rounded-full px-3 py-1 hover:bg-gray-100"
                      aria-label={i.qty === 1 ? "Remove item" : "Decrease quantity"}
                    >
                      {i.qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                    </button>
                    <span className="min-w-[24px] text-center text-sm text-ink" data-testid="line-qty">{i.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(i.id, i.qty + 1)}
                      disabled={i.pending || i.qty >= Math.min(MAX_QTY, i.stock)}
                      className="rounded-full px-3 py-1 hover:bg-gray-100 disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button type="button" onClick={() => remove(i.id)} className="text-sm text-link hover:underline">Delete</button>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <Price value={(i.price || 0) * i.qty} />
                {i.qty > 1 ? <p className="text-xs text-muted">{money(i.price)} each</p> : null}
              </div>
            </div>
          ))}

          <p className="pt-3 text-right text-lg text-ink">
            Subtotal ({count} {count === 1 ? "item" : "items"}): <span className="font-bold" data-testid="subtotal">{money(subtotal)}</span>
          </p>
        </section>

        <aside className="h-fit bg-white p-5">
          <p className="text-lg text-ink">
            Subtotal ({count} {count === 1 ? "item" : "items"}): <span className="font-bold">{money(subtotal)}</span>
          </p>
          <p className="mt-2 flex items-center gap-1 text-sm text-pine"><Check size={14} /> Your order qualifies for free delivery</p>
          <Button className="mt-3 w-full" disabled={items.some((i) => i.pending || i.stock === 0 || i.qty > i.stock)} onClick={() => navigate("/checkout")}>
            Proceed to checkout
          </Button>
          <Link to="/products" className="mt-3 block text-center text-sm text-link hover:underline">Continue shopping</Link>
        </aside>
      </div>
    </main>
  );
}
