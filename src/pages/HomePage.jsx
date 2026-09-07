import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import ProductImage from "../components/ProductImage.jsx";
import Price from "../components/Price.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useFetch } from "../hooks/useFetch.js";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

const tiles = [
  { title: "Shop Black Friday deals", to: "/deals", picks: [15, 1, 2, 13] },
  { title: "Refresh your space", to: "/category/home", picks: [5, 8, 6, 7] },
  { title: "Toys under $40", to: "/category/toys", picks: [13, 14, 15, 9] },
  { title: "Everything for the pets", to: "/category/pets", picks: [16, 17, 18, 6] },
  { title: "Personal care under $25", to: "/category/beauty", picks: [10, 11, 12, 3] },
  { title: "Gifts for the gamer", to: "/category/electronics", picks: [2, 3, 20, 1] },
  { title: "Get moving", to: "/category/sports", picks: [4, 19, 6, 12] },
  { title: "New in fashion", to: "/category/fashion", picks: [19, 9, 11, 3] },
];

function TileSkeleton() {
  return (
    <div className="bg-white p-5 shadow-sm animate-pulse">
      <div className="mb-3 h-6 w-2/3 rounded bg-gray-100" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/3] rounded bg-gray-100" />)}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { add } = useCart();
  const { data: products, loading, error, reload } = useFetch("/products");
  const { data: deals } = useFetch("/products?deals=1&sort=discount&limit=8");
  const byId = Object.fromEntries((products || []).map((p) => [p.id, p]));

  return (
    <main>
      <section className="relative" aria-label="Featured">
        <h1 className="sr-only">Black Friday deals are live</h1>
        <Link to="/deals" aria-label="Shop epic Black Friday deals">
          <img src={`${base}/images/hero-black-friday.jpg`} alt="" className="h-56 w-full object-cover object-top sm:h-80 lg:h-96" />
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-page to-transparent" />
      </section>

      <div className="relative mx-auto -mt-16 max-w-site px-3 pb-6 sm:-mt-24">
        {error ? <ErrorBox error={error} onRetry={reload} /> : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !products
            ? tiles.map((t) => <TileSkeleton key={t.title} />)
            : tiles.map((t) => (
                <div key={t.title} className="flex flex-col bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-xl font-bold text-ink">{t.title}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {t.picks.map((id) => byId[id]).filter(Boolean).map((p) => (
                      <Link key={p.id} to={`/product/${p.id}`} className="rounded" title={p.title}>
                        <ProductImage product={p} />
                        <span className="mt-1 block truncate text-xs text-muted">{p.brand}</span>
                      </Link>
                    ))}
                  </div>
                  <Link to={t.to} className="mt-auto pt-3 text-sm text-link hover:underline">See more</Link>
                </div>
              ))}
        </div>

        <section className="mt-4 bg-white p-5 shadow-sm" aria-labelledby="deals-heading">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 id="deals-heading" className="text-xl font-bold text-ink">Deals ending soon</h2>
            <Link to="/deals" className="text-sm text-link hover:underline">See all deals</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {(deals || []).map((p) => (
              <div key={p.id} className="flex w-44 shrink-0 flex-col">
                <Link to={`/product/${p.id}`} className="rounded"><ProductImage product={p} /></Link>
                <span className="mt-1 w-fit rounded bg-crimson px-2 py-0.5 text-xs font-bold text-white">{p.discount}% off</span>
                <Link to={`/product/${p.id}`} className="mt-1 line-clamp-2 text-sm text-ink hover:underline">{p.title}</Link>
                <div className="mt-1"><Price value={p.price} was={p.was} /></div>
                <Button className="mt-auto w-full" disabled={p.stock === 0} onClick={() => add(p, 1)}>
                  {p.stock === 0 ? "Out of stock" : "Add to cart"}
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 overflow-hidden bg-white shadow-sm">
          <Link to="/category/electronics">
            <img src={`${base}/images/hero-gifts.jpg`} alt="Find gifts for dads who have it all" className="h-40 w-full object-cover object-top sm:h-56" />
          </Link>
        </section>
      </div>
    </main>
  );
}
