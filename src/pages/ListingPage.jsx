import { useEffect, useState } from "react";
import { useParams, useSearchParams, useLocation, Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import FilterSidebar, { PRICE_BANDS } from "../components/FilterSidebar.jsx";
import Skeleton from "../components/Skeleton.jsx";
import ErrorBox from "../components/ErrorBox.jsx";
import Button from "../components/Button.jsx";
import { getCategory } from "../data/products.js";
import { useFetch } from "../hooks/useFetch.js";
import { qs } from "../api.js";

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "low", label: "Price: low to high" },
  { id: "high", label: "Price: high to low" },
  { id: "rating", label: "Average customer review" },
  { id: "discount", label: "Biggest discount" },
];

const emptyFilters = { categories: [], band: "any", minRating: 0, primeOnly: false };

export default function ListingPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const dealsOnly = pathname === "/deals";
  const q = params.get("q") || "";
  const paramCategory = params.get("category");

  const [filters, setFilters] = useState(emptyFilters);
  const [sort, setSort] = useState("featured");

  // A URL change (new category or search) resets the sidebar.
  useEffect(() => {
    const initial = slug || paramCategory;
    setFilters({ ...emptyFilters, categories: initial ? [initial] : [] });
  }, [slug, paramCategory, q, dealsOnly]);

  const band = PRICE_BANDS.find((b) => b.id === filters.band);
  const path = `/products${qs({
    q,
    category: filters.categories,
    minPrice: band.lo > 0 ? band.lo : undefined,
    maxPrice: Number.isFinite(band.hi) ? band.hi : undefined,
    minRating: filters.minRating || undefined,
    prime: filters.primeOnly ? 1 : undefined,
    deals: dealsOnly ? 1 : undefined,
    sort,
  })}`;
  const { data: results, loading, error, reload } = useFetch(path);

  const heading = q
    ? `Results for "${q}"`
    : dealsOnly
    ? "Today's Deals"
    : slug
    ? getCategory(slug)?.name || "Unknown department"
    : "All products";

  return (
    <main className="mx-auto max-w-site px-3 py-4">
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <FilterSidebar filters={filters} onChange={setFilters} />

        <section className="bg-white p-4" aria-live="polite">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div>
              <h1 className="text-lg font-bold text-ink">{heading}</h1>
              <p className="text-xs text-muted" data-testid="result-count">
                {loading || !results ? "Loading results" : `${results.length} ${results.length === 1 ? "result" : "results"}`}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded border border-line px-2 py-1 text-sm">
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          </div>

          {error ? (
            <ErrorBox error={error} onRetry={reload} />
          ) : loading || !results ? (
            <Skeleton />
          ) : results.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-bold text-ink">No results match those filters</p>
              <p className="mt-1 text-sm text-muted">Try a wider price range, clear a department, or search for something else.</p>
              <Link to="/products">
                <Button variant="ghost" className="mt-4" onClick={() => setFilters(emptyFilters)}>Clear all filters</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {results.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
