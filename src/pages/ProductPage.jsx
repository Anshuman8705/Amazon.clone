import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, MapPin, Lock, Truck, RotateCcw } from "lucide-react";
import Stars from "../components/Stars.jsx";
import Price from "../components/Price.jsx";
import Button from "../components/Button.jsx";
import ProductImage from "../components/ProductImage.jsx";
import ProductCard from "../components/ProductCard.jsx";
import Reviews from "../components/Reviews.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import WishlistButton from "../components/WishlistButton.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import { getCategory } from "../data/products.js";
import { useCart, MAX_QTY } from "../context/CartContext.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { compact, deliveryDate } from "../utils/format.js";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { data: fetched, loading, error, reload } = useFetch(`/products/${id}`);
  const [product, setProduct] = useState(null);
  const { data: related } = useFetch(`/products?category=${product?.category || ""}&limit=5`, { enabled: Boolean(product) });
  const [qty, setQty] = useState(1);

  useEffect(() => { setProduct(fetched); }, [fetched]);
  useEffect(() => { setQty(1); }, [id]);

  if (error?.status === 404) return <NotFoundPage message="That product does not exist or has been removed." />;
  if (error) return <main className="mx-auto max-w-site px-3 py-4 md:px-4"><ErrorBox error={error} onRetry={reload} /></main>;
  if (loading || !product) {
    return (
      <main className="mx-auto max-w-site px-3 py-4 md:px-4" aria-busy="true">
        <div className="grid gap-6 bg-white p-5 lg:grid-cols-[minmax(0,460px)_1fr_300px] animate-pulse">
          <div className="aspect-[4/3] rounded bg-gray-100" />
          <div className="space-y-3"><div className="h-7 w-3/4 rounded bg-gray-100" /><div className="h-4 w-1/3 rounded bg-gray-100" /><div className="h-4 w-full rounded bg-gray-100" /></div>
          <div className="h-64 rounded-lg bg-gray-100" />
        </div>
      </main>
    );
  }

  const category = getCategory(product.category);
  const maxQty = Math.min(MAX_QTY, product.stock);
  const out = product.stock === 0;
  const others = (related || []).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <main className="mx-auto max-w-site px-3 py-4 md:px-4">
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted" aria-label="Breadcrumb">
        <Link to="/products" className="hover:text-link hover:underline">All products</Link>
        <ChevronRight size={12} />
        <Link to={`/category/${product.category}`} className="hover:text-link hover:underline">{category?.name}</Link>
        <ChevronRight size={12} />
        <span className="truncate text-ink">{product.brand}</span>
      </nav>

      <div className="grid gap-5 bg-white p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_290px] lg:grid-rows-[auto_1fr] lg:gap-x-8">
        <div className="lg:row-span-2">
          <ProductImage product={product} fit="contain" className="border border-line" />
        </div>

        <div className="lg:col-start-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl leading-snug text-ink">{product.title}</h1>
            <WishlistButton product={product} className="mt-1 shrink-0" />
          </div>
          <Link to={`/products?q=${encodeURIComponent(product.brand)}`} className="mt-1 inline-block text-sm text-link hover:underline">
            Visit the {product.brand} Store
          </Link>
          <div className="mt-2 flex items-center gap-2 border-b border-line pb-3">
            <Stars value={product.rating} size={16} />
            <span className="text-sm text-ink" data-testid="rating">{product.rating.toFixed(1)}</span>
            <a href="#reviews-heading" className="text-sm text-link hover:underline"><span data-testid="review-count">{compact(product.reviews)}</span> ratings</a>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="rounded bg-crimson px-2 py-1 text-sm font-bold text-white">-{product.discount}%</span>
            <Price value={product.price} was={product.was} size="lg" />
          </div>
          <p className="mt-1 text-xs text-muted">Demo store. Orders are recorded but no card is charged.</p>
        </div>

        <aside className="h-fit rounded-lg border border-line p-4 lg:col-start-3 lg:row-span-2">
          <Price value={product.price} size="lg" />
          {product.prime ? (
            <p className="mt-2 text-sm text-ink"><span className="font-bold">Free delivery</span> {deliveryDate()}</p>
          ) : (
            <p className="mt-2 text-sm text-ink">$5.99 delivery {deliveryDate()}</p>
          )}
          <p className="mt-1 flex items-center gap-1 text-sm text-link"><MapPin size={14} /> Deliver to India</p>
          <p className={`mt-3 text-lg font-medium ${product.stock > 8 ? "text-pine" : "text-crimson"}`} data-testid="stock">
            {out ? "Out of stock" : product.stock > 8 ? "In stock" : `Only ${product.stock} left in stock`}
          </p>

          {!out ? (
            <label className="mt-3 block text-sm text-ink">
              Quantity
              <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="ml-2 rounded border border-line px-2 py-1" aria-label="Quantity">
                {Array.from({ length: maxQty }).map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
              </select>
            </label>
          ) : null}

          <Button className="mt-3 w-full" disabled={out} onClick={() => add(product, qty)}>Add to cart</Button>
          <Button variant="orange" className="mt-2 w-full" disabled={out} onClick={() => { add(product, qty, { silent: true }); navigate("/checkout"); }}>
            Buy now
          </Button>

          <div className="mt-4 space-y-2 text-xs text-muted">
            <p className="flex items-center gap-2"><Lock size={14} /> Secure transaction</p>
            <p className="flex items-center gap-2"><Truck size={14} /> Ships from Amazon</p>
            <p className="flex items-center gap-2"><RotateCcw size={14} /> Returnable within 30 days</p>
          </div>
        </aside>

        <div className="lg:col-start-2">
          <h2 className="font-bold text-ink">About this item</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
            {product.bullets.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
      </div>

      <Reviews productId={product.id} onSaved={(updated) => setProduct(updated)} />

      {others.length ? (
        <section className="mt-4 bg-white p-5" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-3 text-xl font-bold text-ink">More in {category?.name}</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-4">
            {others.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ) : null}
    </main>
  );
}
