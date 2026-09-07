import { Link } from "react-router-dom";
import HeroCarousel from "../components/HeroCarousel.jsx";
import ProductCarousel from "../components/ProductCarousel.jsx";
import ProductImage from "../components/ProductImage.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import { useUser } from "../context/UserContext.jsx";
import { useFetch } from "../hooks/useFetch.js";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

// Each tile shows four products from the catalogue. Ids are chosen so that
// every product appears somewhere and nothing appears twice on the page.
const tiles = [
  { title: "Shop today's deals", to: "/deals", picks: [15, 1, 2, 13] },
  { title: "Refresh your space", to: "/category/home", picks: [5, 8, 6, 7] },
  { title: "Toys under $40", to: "/category/toys", picks: [14, 13, 15, 9] },
  { title: "Everything for the pets", to: "/category/pets", picks: [16, 17, 18, 4] },
  { title: "Personal care under $25", to: "/category/beauty", picks: [10, 11, 12, 9] },
  { title: "Tech and accessories", to: "/category/electronics", picks: [2, 3, 20, 1] },
  { title: "Get moving", to: "/category/sports", picks: [4, 19, 10, 20] },
  { title: "New in fashion", to: "/category/fashion", picks: [19, 9, 11, 3] },
];

function TileSkeleton() {
  return (
    <div className="animate-pulse bg-white p-5 shadow-sm">
      <div className="mb-3 h-6 w-2/3 rounded bg-gray-100" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/3] rounded bg-gray-100" />)}
      </div>
    </div>
  );
}

function SignInTile() {
  return (
    <div className="flex flex-col bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-xl font-bold text-ink">Sign in for the best experience</h2>
      <Link to="/signin" className="rounded-full border border-sunny-dark bg-sunny px-4 py-1.5 text-center text-sm text-ink shadow-sm hover:bg-sunny-dark">Sign in securely</Link>
      <p className="mt-3 text-sm text-muted">Your cart, orders and wishlist follow you across devices.</p>
      <Link to="/register" className="mt-auto pt-3 text-sm text-link hover:underline">New customer? Start here.</Link>
    </div>
  );
}

export default function HomePage() {
  const { user } = useUser();
  const { data: products, loading, error, reload } = useFetch("/products");
  const { data: deals } = useFetch("/products?deals=1&sort=discount&limit=10");
  const { data: top } = useFetch("/products?sort=rating&limit=10");
  const { data: cheap } = useFetch("/products?maxPrice=25&sort=featured&limit=10");
  const byId = Object.fromEntries((products || []).map((p) => [p.id, p]));
  // Signed-out visitors get a sign-in tile in the first row; to keep the grid
  // at eight cards the last tile steps aside for it.
  const shown = user ? tiles : tiles.slice(0, tiles.length - 1);

  return (
    <main>
      <h1 className="sr-only">Today's deals, gifts and new arrivals</h1>
      <HeroCarousel />

      <div className="relative mx-auto -mt-24 max-w-site px-3 pb-6 sm:-mt-40 lg:-mt-72">
        {error ? <ErrorBox error={error} onRetry={reload} /> : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !products
            ? tiles.map((t) => <TileSkeleton key={t.title} />)
            : shown.map((t, i) => (
                <div key={t.title} className="contents">
                  {i === 3 && !user ? <SignInTile /> : null}
                  <div className="flex flex-col bg-white p-5 shadow-sm">
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
                </div>
              ))}
        </div>

        <div className="mt-4 space-y-4">
          <ProductCarousel
            title="Deals ending soon"
            to="/deals"
            products={deals}
            loading={!deals}
            badge={(p) => <span className="mt-1 w-fit rounded-sm bg-crimson px-1.5 py-0.5 text-xs font-bold text-white">{p.discount}% off</span>}
          />

          <section className="overflow-hidden bg-white shadow-sm">
            <Link to="/products" className="block">
              <img src={`${base}/images/promo-delivery.jpg`} alt="Free delivery on every order, no minimum spend" className="h-28 w-full object-cover object-left sm:h-40" loading="lazy" />
            </Link>
          </section>

          <ProductCarousel title="Best sellers" to="/products" products={top} loading={!top} />
          <ProductCarousel title="Under $25" to="/products" products={cheap} loading={!cheap} />
        </div>
      </div>
    </main>
  );
}
