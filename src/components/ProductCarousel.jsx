import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductImage from "./ProductImage.jsx";
import Price from "./Price.jsx";
import Stars from "./Stars.jsx";
import Button from "./Button.jsx";
import { useCart } from "../context/CartContext.jsx";
import { compact } from "../utils/format.js";

// A row of product cards that scrolls sideways. On a touch screen you swipe;
// with a mouse the arrows scroll one viewport at a time. Arrows disable at the
// ends rather than hiding, so the layout never shifts.
export default function ProductCarousel({ title, to, products, loading, badge }) {
  const { add } = useCart();
  const track = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = () => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  };

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return undefined;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => { el.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); };
  }, [products]);

  const scroll = (dir) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrow = "absolute top-1/2 z-10 hidden h-24 w-11 -translate-y-1/2 items-center justify-center rounded border border-line bg-white/95 shadow-md hover:bg-gray-50 disabled:opacity-0 md:flex";

  return (
    <section className="relative bg-white p-4 shadow-sm sm:p-5" aria-label={title}>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        {to ? <Link to={to} className="text-sm text-link hover:underline">See more</Link> : null}
      </div>
      <div className="relative">
        <button type="button" className={`${arrow} -left-3`} onClick={() => scroll(-1)} disabled={edges.start} aria-label={`Scroll ${title} left`}><ChevronLeft size={28} /></button>
        <button type="button" className={`${arrow} -right-3`} onClick={() => scroll(1)} disabled={edges.end} aria-label={`Scroll ${title} right`}><ChevronRight size={28} /></button>
        <div ref={track} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {loading || !products
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-40 shrink-0 animate-pulse sm:w-48">
                  <div className="aspect-[4/3] rounded bg-gray-100" />
                  <div className="mt-2 h-3 rounded bg-gray-100" /><div className="mt-1 h-3 w-2/3 rounded bg-gray-100" />
                </div>
              ))
            : products.map((p) => (
                <div key={p.id} className="flex w-40 shrink-0 snap-start flex-col sm:w-48">
                  <Link to={`/product/${p.id}`} className="rounded" title={p.title}><ProductImage product={p} /></Link>
                  {badge ? badge(p) : null}
                  <Link to={`/product/${p.id}`} className="mt-1 line-clamp-2 text-sm text-ink hover:text-link hover:underline">{p.title}</Link>
                  <div className="mt-0.5 flex items-center gap-1"><Stars value={p.rating} /><span className="text-xs text-link">{compact(p.reviews)}</span></div>
                  <div className="mt-1"><Price value={p.price} was={p.was} /></div>
                  <Button className="mt-auto w-full" disabled={p.stock === 0} onClick={() => add(p, 1)}>
                    {p.stock === 0 ? "Out of stock" : "Add to cart"}
                  </Button>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
