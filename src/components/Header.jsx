import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, MapPin, Menu, ChevronDown, Heart, Package, User, Shield, LogOut } from "lucide-react";
import { CATEGORIES } from "../data/products.js";
import { useCart } from "../context/CartContext.jsx";
import { useUser } from "../context/UserContext.jsx";
import { api, qs } from "../api.js";
import { money } from "../utils/format.js";

const logo = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/images/logo.png`;
const navBtn = "shrink-0 rounded px-2 py-1 text-white hover:outline hover:outline-1 hover:outline-white";

function AccountMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const item = "flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-gray-100";
  return (
    <div ref={ref} className="relative hidden sm:block">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className={`${navBtn} text-left leading-tight`}>
        <span className="block text-xs">Hello, {user.name.split(" ")[0]}</span>
        <span className="flex items-center gap-1 text-sm font-bold">Account & Lists <ChevronDown size={12} /></span>
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-40 mt-1 w-56 rounded border border-line bg-white py-1 shadow-lg">
          <Link role="menuitem" to="/account" className={item} onClick={() => setOpen(false)}><User size={16} /> Your account</Link>
          <Link role="menuitem" to="/orders" className={item} onClick={() => setOpen(false)}><Package size={16} /> Your orders</Link>
          <Link role="menuitem" to="/wishlist" className={item} onClick={() => setOpen(false)}><Heart size={16} /> Your wishlist</Link>
          {user.role === "admin" ? <Link role="menuitem" to="/admin" className={item} onClick={() => setOpen(false)}><Shield size={16} /> Store admin</Link> : null}
          <button role="menuitem" type="button" onClick={() => { setOpen(false); logout(); }} className={`${item} w-full border-t border-line`}><LogOut size={16} /> Sign out</button>
        </div>
      ) : null}
    </div>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [hints, setHints] = useState([]);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  // Suggestions: a debounced lookup against the API as you type.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setHints([]); return undefined; }
    const t = setTimeout(() => {
      api(`/products${qs({ q, category: category === "all" ? undefined : category, limit: 6 })}`)
        .then((rows) => { setHints(rows); setOpen(true); })
        .catch(() => setHints([]));
    }, 180);
    return () => clearTimeout(t);
  }, [query, category]);

  useEffect(() => {
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    setOpen(false);
    navigate(`/products${qs({ q: query.trim(), category: category === "all" ? undefined : category })}`);
  };

  return (
    <div ref={box} className="relative min-w-0 flex-1">
      <form onSubmit={submit} role="search" className="flex items-stretch overflow-hidden rounded focus-within:ring-2 focus-within:ring-ember">
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Search in department" className="hidden shrink-0 border-r border-line bg-gray-200 px-2 text-xs text-ink sm:block">
          <option value="all">All</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hints.length && setOpen(true)}
          placeholder="Search Amazon"
          aria-label="Search Amazon"
          autoComplete="off"
          className="min-w-0 flex-1 px-3 py-2 text-sm text-ink focus:outline-none"
        />
        <button type="submit" aria-label="Search" className="shrink-0 bg-ember px-4 hover:bg-ember-dark"><Search size={18} className="text-navy" /></button>
      </form>
      {open && hints.length ? (
        <ul className="absolute left-0 right-0 z-40 mt-1 rounded border border-line bg-white py-1 shadow-lg" role="listbox" aria-label="Suggestions">
          {hints.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => { setOpen(false); setQuery(""); navigate(`/product/${p.id}`); }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-ink hover:bg-gray-100"
              >
                <span className="truncate">{p.title}</span>
                <span className="shrink-0 text-xs text-muted">{money(p.price)}</span>
              </button>
            </li>
          ))}
          <li className="border-t border-line">
            <button type="button" onClick={submit} className="w-full px-3 py-2 text-left text-sm text-link hover:bg-gray-100">See all results for "{query.trim()}"</button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

export default function Header() {
  const { count } = useCart();
  const { user, logout } = useUser();

  return (
    <header className="sticky top-0 z-30">
      <div className="bg-navy px-3 py-2">
        <div className="mx-auto flex max-w-site items-center gap-2">
          <Link to="/" className={`${navBtn} flex items-center`} aria-label="Amazon Clone home">
            <img src={logo} alt="amazon" className="h-7 w-auto" />
          </Link>
          <Link to="/account" className={`${navBtn} hidden items-center gap-1 md:flex`}>
            <MapPin size={16} />
            <span className="text-left leading-tight">
              <span className="block text-xs text-gray-300">Deliver to</span>
              <span className="block text-sm font-bold">India</span>
            </span>
          </Link>

          <SearchBox />

          {user ? (
            <AccountMenu user={user} logout={logout} />
          ) : (
            <Link to="/signin" className={`${navBtn} hidden text-left leading-tight sm:block`}>
              <span className="block text-xs">Hello, sign in</span>
              <span className="flex items-center gap-1 text-sm font-bold">Account & Lists <ChevronDown size={12} /></span>
            </Link>
          )}

          <Link to="/orders" className={`${navBtn} hidden text-left leading-tight lg:block`}>
            <span className="block text-xs">Returns</span>
            <span className="block text-sm font-bold">& Orders</span>
          </Link>

          <Link to="/cart" className={`${navBtn} relative flex items-end gap-1`} aria-label={`Cart, ${count} items`}>
            <span className="relative">
              <ShoppingCart size={26} />
              <span data-testid="cart-count" className="absolute -top-1 left-3 min-w-[18px] rounded-full bg-ember px-1 text-center text-xs font-bold text-navy">{count}</span>
            </span>
            <span className="hidden text-sm font-bold md:inline">Cart</span>
          </Link>
        </div>
      </div>

      <nav className="bg-slate px-3" aria-label="Departments">
        <div className="mx-auto flex max-w-site items-center gap-1 overflow-x-auto py-1 text-sm text-white">
          <NavLink to="/products" end className={`${navBtn} flex items-center gap-1 font-bold`}><Menu size={16} /> All</NavLink>
          {CATEGORIES.map((c) => (
            <NavLink key={c.slug} to={`/category/${c.slug}`} className={({ isActive }) => `${navBtn} ${isActive ? "underline" : ""}`}>{c.name}</NavLink>
          ))}
          <NavLink to="/deals" className={({ isActive }) => `${navBtn} ${isActive ? "underline" : ""}`}>Today's Deals</NavLink>
          {user?.role === "admin" ? <NavLink to="/admin" className={({ isActive }) => `${navBtn} ml-auto font-bold ${isActive ? "underline" : ""}`}>Store admin</NavLink> : null}
        </div>
      </nav>
    </header>
  );
}
