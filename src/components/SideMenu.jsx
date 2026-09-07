import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, User, ChevronRight } from "lucide-react";
import { CATEGORIES } from "../data/products.js";
import { useUser } from "../context/UserContext.jsx";

// The panel behind the "All" button: shop by department, a few programme
// links, and help & settings. Renders only while open, so the page never has
// two copies of the same links in it.
export default function SideMenu({ open, onClose }) {
  const { user, logout } = useUser();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const row = "flex items-center justify-between px-9 py-2.5 text-sm text-ink hover:bg-gray-100";
  const head = "px-9 pb-1 pt-4 text-base font-bold text-ink";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={onClose} />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="absolute left-[min(372px,calc(85vw+8px))] top-2 z-10 rounded p-1 text-white hover:bg-white/10"
      >
        <X size={30} />
      </button>
      <div className="absolute inset-y-0 left-0 flex w-[365px] max-w-[85vw] flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate px-9 py-3 text-white">
          <Link to={user ? "/account" : "/signin"} onClick={onClose} className="flex items-center gap-2 text-lg font-bold">
            <User size={22} /> Hello, {user ? user.name.split(" ")[0] : "sign in"}
          </Link>
        </div>

        <p className={head}>Shop by department</p>
        {CATEGORIES.map((c) => (
          <Link key={c.slug} to={`/category/${c.slug}`} className={row} onClick={onClose}>
            {c.name} <ChevronRight size={16} className="text-muted" />
          </Link>
        ))}
        <Link to="/products" className={row} onClick={onClose}>All products <ChevronRight size={16} className="text-muted" /></Link>

        <hr className="my-2 border-line" />
        <p className={head}>Programs & features</p>
        <Link to="/deals" className={row} onClick={onClose}>Today's Deals <ChevronRight size={16} className="text-muted" /></Link>
        <Link to="/wishlist" className={row} onClick={onClose}>Your wishlist <ChevronRight size={16} className="text-muted" /></Link>

        <hr className="my-2 border-line" />
        <p className={head}>Help & settings</p>
        <Link to="/account" className={row} onClick={onClose}>Your account</Link>
        <Link to="/orders" className={row} onClick={onClose}>Your orders</Link>
        {user?.role === "admin" ? <Link to="/admin" className={row} onClick={onClose}>Store admin</Link> : null}
        {user ? (
          <button type="button" className={`${row} w-full text-left`} onClick={() => { onClose(); logout(); }}>Sign out</button>
        ) : (
          <Link to="/signin" className={row} onClick={onClose}>Sign in</Link>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
