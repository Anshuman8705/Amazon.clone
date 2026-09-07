import { useEffect, useState } from "react";
import { useParams, useSearchParams, useLocation, Link } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { useMediaQuery, PHONE } from "../hooks/useMediaQuery.js";
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
  const phone = useMediaQuery(PHONE);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [sheetOpen]);

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

  const activeCount =
    filters.categories.length + (filters.band !== "any" ? 1 : 0) + (filters.minRating ? 1 : 0) + (filters.primeOnly ? 1 : 0);

  const heading = q
    ? `Results for "${q}"`
    : dealsOnly
    ? "Today's Deals"
    : slug
    ? getCategory(slug)?.name || "Unknown department"
    : "All products";

  const sortSelect = (
    <label className="flex items-center gap-2 text-sm text-ink">
      <span className="hidden sm:inline">Sort by</span>
      <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by" className="rounded-lg border border-line bg-gray-50 px-2 py-1.5 text-sm shadow-sm">
        {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
    </label>
  );

  return (
    <main className="px-3 py-4 md:px-4">
      <div className="grid gap-4 md:grid-cols-[230px_1fr] lg:grid-cols-[250px_1fr]">
        {!phone ? <FilterSidebar filters={filters} onChange={setFilters} /> : null}

        <section className="min-w-0 bg-white p-3 sm:p-4" aria-live="polite">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-ink">{heading}</h1>
              <p className="text-xs text-muted" data-testid="result-count">
                {loading || !results ? "Loading results" : `${results.length} ${results.length === 1 ? "result" : "results"}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {phone ? (
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-line bg-gray-50 px-3 py-1.5 text-sm text-ink shadow-sm"
                  aria-haspopup="dialog"
                >
                  <SlidersHorizontal size={16} /> Filters{activeCount ? ` (${activeCount})` : ""}
                </button>
              ) : null}
              {sortSelect}
            </div>
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
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
              {results.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>

      {phone && sheetOpen ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close filters" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-4 py-3">
              <p className="text-base font-bold text-ink">Filters</p>
              <div className="flex items-center gap-3">
                {activeCount ? <button type="button" className="text-sm text-link hover:underline" onClick={() => setFilters(emptyFilters)}>Clear all</button> : null}
                <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close filters" className="rounded p-1 hover:bg-gray-100"><X size={22} /></button>
              </div>
            </div>
            <FilterSidebar filters={filters} onChange={setFilters} />
            <div className="sticky bottom-0 border-t border-line bg-white p-3">
              <Button className="w-full" onClick={() => setSheetOpen(false)}>
                Show {loading || !results ? "results" : `${results.length} ${results.length === 1 ? "result" : "results"}`}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
