import { Link, Navigate } from "react-router-dom";
import { Heart } from "lucide-react";
import Button from "../components/Button.jsx";
import ProductImage from "../components/ProductImage.jsx";
import Price from "../components/Price.jsx";
import { useUser } from "../context/UserContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function WishlistPage() {
  const { user, ready } = useUser();
  const { items, remove } = useWishlist();
  const { add } = useCart();

  if (ready && !user) return <Navigate to="/signin" state={{ from: "/wishlist" }} replace />;

  return (
    <main className="mx-auto max-w-screen-md px-3 py-6">
      <h1 className="mb-4 text-2xl font-bold text-ink">Your wishlist</h1>
      {items.length === 0 ? (
        <div className="bg-white p-10 text-center">
          <Heart size={48} className="mx-auto text-muted" />
          <p className="mt-4 text-lg font-bold text-ink">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted">Tap the heart on any product to keep it here for later.</p>
          <Link to="/products"><Button className="mt-4 px-6">Browse products</Button></Link>
        </div>
      ) : (
        <div className="divide-y divide-line bg-white" data-testid="wishlist">
          {items.map((p) => (
            <div key={p.id} className="flex gap-4 p-4">
              <Link to={`/product/${p.id}`} className="w-28 shrink-0 rounded"><ProductImage product={p} /></Link>
              <div className="min-w-0 flex-1">
                <Link to={`/product/${p.id}`} className="text-base text-ink hover:underline">{p.title}</Link>
                <div className="mt-1"><Price value={p.price} was={p.was} /></div>
                <p className={`mt-1 text-xs ${p.stock === 0 ? "text-crimson" : "text-pine"}`}>{p.stock === 0 ? "Out of stock" : "In stock"}</p>
                <div className="mt-2 flex gap-3">
                  <Button disabled={p.stock === 0} onClick={() => add(p, 1)}>Add to cart</Button>
                  <button type="button" onClick={() => remove(p.id)} className="text-sm text-link hover:underline">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
