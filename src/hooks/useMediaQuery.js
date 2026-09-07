import { useEffect, useState } from "react";

// True when the CSS media query matches. Used where the phone layout is a
// different component tree rather than the desktop one with classes toggled,
// which keeps the DOM free of duplicate controls (one search box, one cart
// link) for screen readers and for the tests. jsdom has no matchMedia, so the
// hook reports false there and the desktop tree renders.
export function useMediaQuery(query) {
  const supported = typeof window !== "undefined" && typeof window.matchMedia === "function";
  const [matches, setMatches] = useState(() => (supported ? window.matchMedia(query).matches : false));

  useEffect(() => {
    if (!supported) return undefined;
    const mq = window.matchMedia(query);
    const update = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query, supported]);

  return matches;
}

export const PHONE = "(max-width: 767px)";
