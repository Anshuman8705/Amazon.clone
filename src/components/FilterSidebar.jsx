import Stars from "./Stars.jsx";
import { CATEGORIES } from "../data/products.js";

export const PRICE_BANDS = [
  { id: "any", label: "Any price", lo: 0, hi: Infinity },
  { id: "under25", label: "Under $25", lo: 0, hi: 25 },
  { id: "25to50", label: "$25 to $50", lo: 25, hi: 50 },
  { id: "50to100", label: "$50 to $100", lo: 50, hi: 100 },
  { id: "over100", label: "$100 and above", lo: 100, hi: Infinity },
];

export default function FilterSidebar({ filters, onChange }) {
  const toggleCategory = (slug) => {
    const next = filters.categories.includes(slug)
      ? filters.categories.filter((c) => c !== slug)
      : [...filters.categories, slug];
    onChange({ ...filters, categories: next });
  };

  return (
    <aside className="bg-white p-4 md:self-start" aria-label="Filters">
      <h2 className="mb-2 text-base font-bold text-ink">Department</h2>
      <div className="mb-4 space-y-1">
        {CATEGORIES.map((c) => (
          <label key={c.slug} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={filters.categories.includes(c.slug)}
              onChange={() => toggleCategory(c.slug)}
            />
            {c.name}
          </label>
        ))}
      </div>

      <h2 className="mb-2 font-bold text-ink">Price</h2>
      <div className="mb-4 space-y-1">
        {PRICE_BANDS.map((b) => (
          <label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input type="radio" name="price" checked={filters.band === b.id} onChange={() => onChange({ ...filters, band: b.id })} />
            {b.label}
          </label>
        ))}
      </div>

      <h2 className="mb-2 font-bold text-ink">Customer review</h2>
      <div className="space-y-1">
        {[4, 3, 0].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange({ ...filters, minRating: r })}
            className={`flex items-center gap-2 rounded text-sm hover:underline ${filters.minRating === r ? "font-bold text-ink" : "text-link"}`}
          >
            {r === 0 ? "Any rating" : (<><Stars value={r} /><span>& up</span></>)}
          </button>
        ))}
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={filters.primeOnly} onChange={() => onChange({ ...filters, primeOnly: !filters.primeOnly })} />
        Free delivery only
      </label>
    </aside>
  );
}
