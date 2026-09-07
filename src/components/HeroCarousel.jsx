import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const SLIDES = [
  { id: "deals", image: "/images/hero-deals.jpg", alt: "Shop epic deals, up to 50% off today only", to: "/deals" },
  { id: "gifts", image: "/images/hero-gifts.jpg", alt: "Gifts for everyone on your list, curated picks under $50", to: "/products" },
  { id: "home", image: "/images/hero-home.jpg", alt: "Refresh your space, new in home and kitchen", to: "/category/home" },
];

// A three-slide hero. Advances on its own every seven seconds unless the
// visitor prefers reduced motion or has the pointer over it; the arrows and
// the keyboard always work. Only the current slide is in the tab order. Like
// Amazon's, it has no dot indicators: the tile grid covers the lower half.
export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reduce.current) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, [paused]);

  const go = (delta) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);
  const arrow = "absolute top-0 z-10 hidden h-[65%] w-14 items-center justify-center text-ink/80 outline-none hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ember sm:w-20 md:flex";

  // On a phone there are no arrows; a horizontal swipe changes the slide.
  const touchX = useRef(null);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  return (
    <section
      className="relative"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative h-[300px] overflow-hidden sm:h-[380px] lg:h-[600px]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {SLIDES.map((s, i) => (
          <Link
            key={s.id}
            to={s.to}
            aria-label={s.alt}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <picture>
              <source media="(max-width: 767px)" srcSet={`${base}${s.image.replace(".jpg", "-phone.jpg")}`} />
              <img src={`${base}${s.image}`} alt="" className="h-full w-full object-cover object-top" loading={i === 0 ? "eager" : "lazy"} />
            </picture>
          </Link>
        ))}
        <button type="button" className={`${arrow} left-0`} onClick={() => go(-1)} aria-label="Previous slide"><ChevronLeft size={44} strokeWidth={1.5} /></button>
        <button type="button" className={`${arrow} right-0`} onClick={() => go(1)} aria-label="Next slide"><ChevronRight size={44} strokeWidth={1.5} /></button>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-page to-transparent" />
      </div>
    </section>
  );
}
