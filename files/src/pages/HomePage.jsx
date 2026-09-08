import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/products.js";
import ProductCarousel from "../components/ProductCarousel.jsx";
import ProductImage from "../components/ProductImage.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import { useFetch } from "../hooks/useFetch.js";

export default function HomePage() {
  const { data, loading, error, reload } = useFetch("/products");
  const products = data || [];
  const deals = [...products].filter((p) => p.discount >= 25).sort((a, b) => b.discount - a.discount).slice(0, 10);
  const rated = [...products].filter((p) => p.reviews > 0).sort((a, b) => b.rating - a.rating).slice(0, 10);
  const affordable = products.filter((p) => p.price <= 999).slice(0, 10);
  const categories = CATEGORIES.map((category) => ({ ...category,
    items: products.filter((p) => p.category === category.slug).slice(0, 4),
  })).filter((category) => category.items.length);
  return (
    <main>
      <section className="bg-navy px-5 py-12 text-white sm:px-8">
        <div className="mx-auto max-w-site">
          <p className="text-sm font-medium text-amber-200">NimbusMart India · Interactive shopping demo</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">Everyday finds. One simple place to explore.</h1>
          <p className="mt-4 max-w-xl text-base text-gray-200">Browse tech, home essentials and more. Explore prices in rupees, try the cart and place a demo order—without paying a rupee.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/products" className="rounded-full bg-sunny px-6 py-3 text-sm font-bold text-ink">Explore all products</Link>
            <Link to="/deals" className="rounded-full border border-white px-6 py-3 text-sm font-medium">Browse sample offers</Link>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-site px-3 py-6 sm:px-5">
        <p className="mb-5 rounded border border-line bg-amber-50 p-3 text-sm" role="note">Demonstration only. Products, prices and delivery estimates are illustrative. No money is collected and no goods are shipped. Do not enter real payment details.</p>
        {error && <ErrorBox error={error} onRetry={reload} />}
        {loading && !data && <p role="status" className="py-6 text-muted">Loading the sample catalogue…</p>}
        {!error && !loading && !products.length && <p className="rounded bg-white p-6">The sample catalogue is currently empty. Please try again later.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => <section key={category.slug} className="flex flex-col rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-ink">{category.name}</h2>
            <div className="grid grid-cols-2 gap-3">
              {category.items.map((product) => <Link key={product.id} to={`/product/${product.id}`} className="rounded" title={product.title}>
                <ProductImage product={product} />
                <span className="mt-1 block line-clamp-2 text-xs text-muted">{product.title}</span>
              </Link>)}
            </div>
            <Link to={`/category/${category.slug}`} className="mt-auto pt-4 text-sm font-medium text-link hover:underline">Browse {category.name.toLowerCase()}</Link>
          </section>)}
        </div>
        <div className="mt-6 space-y-5">
          {deals.length > 0 && <ProductCarousel title="Sample offers" to="/deals" products={deals} loading={false} />}
          {rated.length > 0 && <ProductCarousel title="Top rated by demo users" to="/products?sort=rating" products={rated} loading={false} />}
          {affordable.length > 0 && <ProductCarousel title="Finds at ₹999 and below" to="/products?maxPrice=999" products={affordable} loading={false} />}
        </div>
      </div>
    </main>
  );
}
