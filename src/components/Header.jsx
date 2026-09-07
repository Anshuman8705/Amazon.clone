import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, MapPin, Menu, ChevronDown, ChevronRight, Heart, Package, User, Shield, LogOut } from "lucide-react";
import { CATEGORIES } from "../data/products.js";
import { useCart } from "../context/CartContext.jsx";
import { useUser } from "../context/UserContext.jsx";
import { useMediaQuery, PHONE } from "../hooks/useMediaQuery.js";
import { api, qs } from "../api.js";
import { money } from "../utils/format.js";
import SideMenu from "./SideMenu.jsx";

const logo = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/images/logo.png`;

// Every clickable thing in the dark bars gets the same 1px white outline on
// hover that Amazon uses, so the header reads as one system.
const navBtn = "shrink-0 rounded-sm border border-transparent px-2 py-1 text-white hover:border-white";

function AccountMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const key = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", key); };
  }, [open]);

  const item = "flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-gray-100";
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className={`${navBtn} text-left leading-tight`}>
        <span className="block text-xs">Hello, {user.name.split(" ")[0]}</span>
        <span className="flex items-center gap-1 text-sm font-bold">Account & Lists <ChevronDown size={12} /></span>
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-40 mt-1 w-60 rounded border border-line bg-white py-1 shadow-lg">
          <p className="border-b border-line px-3 py-2 text-xs text-muted">Signed in as {user.email}</p>
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

function SearchBox({ compact = false }) {
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
      <form onSubmit={submit} role="search" className="flex h-10 items-stretch overflow-hidden rounded-md bg-white focus-within:ring-[3px] focus-within:ring-ember">
        {!compact ? (
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Search in department" className="shrink-0 border-r border-line bg-gray-100 px-2 text-xs text-ink hover:bg-gray-200">
            <option value="all">All</option>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        ) : null}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hints.length && setOpen(true)}
          placeholder="Search Amazon"
          aria-label="Search Amazon"
          autoComplete="off"
          className="min-w-0 flex-1 px-3 text-[15px] text-ink placeholder:text-muted focus:outline-none"
        />
        <button type="submit" aria-label="Search" className="shrink-0 bg-ember px-3.5 hover:bg-ember-dark"><Search size={20} className="text-navy" /></button>
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
                <span className="flex min-w-0 items-center gap-2"><Search size={14} className="shrink-0 text-muted" /><span className="truncate">{p.title}</span></span>
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

function CartLink({ count, label = true }) {
  return (
    <Link to="/cart" className={`${navBtn} relative flex items-end gap-1`} aria-label={`Cart, ${count} items`}>
      <span className="relative">
        <ShoppingCart size={30} strokeWidth={1.8} />
        <span data-testid="cart-count" className="absolute -top-1.5 left-[15px] min-w-[20px] rounded-full bg-ember px-1 text-center text-sm font-bold leading-5 text-navy">{count}</span>
      </span>
      {label ? <span className="text-sm font-bold">Cart</span> : null}
    </Link>
  );
}

function DesktopHeader({ user, logout, count, openMenu }) {
  return (
    <>
      <div className="bg-navy px-3">
        <div className="flex h-[60px] items-center gap-1.5">
          <Link to="/" className={`${navBtn} flex items-center py-2`} aria-label="Amazon Clone home">
            <img src={logo} alt="amazon" className="h-7 w-auto" />
          </Link>
          <Link to="/account" className={`${navBtn} hidden items-end gap-0.5 md:flex`}>
            <MapPin size={18} className="mb-0.5" />
            <span className="text-left leading-tight">
              <span className="block text-xs text-gray-300">Deliver to</span>
              <span className="block text-sm font-bold">India</span>
            </span>
          </Link>

          <div className="mx-2 flex min-w-0 flex-1"><SearchBox /></div>

          {user ? (
            <AccountMenu user={user} logout={logout} />
          ) : (
            <Link to="/signin" className={`${navBtn} text-left leading-tight`}>
              <span className="block text-xs">Hello, sign in</span>
              <span className="flex items-center gap-1 text-sm font-bold">Account & Lists <ChevronDown size={12} /></span>
            </Link>
          )}

          <Link to="/orders" className={`${navBtn} hidden text-left leading-tight lg:block`}>
            <span className="block text-xs">Returns</span>
            <span className="block text-sm font-bold">& Orders</span>
          </Link>

          <CartLink count={count} />
        </div>
      </div>

      <nav className="bg-slate px-3" aria-label="Departments">
        <div className="flex h-[39px] items-center gap-0.5 overflow-x-auto text-sm text-white">
          <button type="button" onClick={openMenu} className={`${navBtn} flex items-center gap-1 font-bold`} aria-label="Open all departments menu">
            <Menu size={20} /> All
          </button>
          <NavLink to="/deals" className={({ isActive }) => `${navBtn} ${isActive ? "font-bold" : ""}`}>Today's Deals</NavLink>
          {CATEGORIES.map((c) => (
            <NavLink key={c.slug} to={`/category/${c.slug}`} className={({ isActive }) => `${navBtn} ${isActive ? "font-bold" : ""}`}>{c.name}</NavLink>
          ))}
          {user?.role === "admin" ? <NavLink to="/admin" className={({ isActive }) => `${navBtn} ml-auto font-bold ${isActive ? "underline" : ""}`}>Store admin</NavLink> : null}
        </div>
      </nav>
    </>
  );
}

function PhoneHeader({ user, count, openMenu }) {
  return (
    <>
      <div className="bg-navy px-3 pb-2 pt-2.5">
        <div className="flex items-center gap-2">
          <button type="button" onClick={openMenu} className={`${navBtn} -ml-1 px-1`} aria-label="Open all departments menu">
            <Menu size={26} />
          </button>
          <Link to="/" className={`${navBtn} flex items-center px-1`} aria-label="Amazon Clone home">
            <img src={logo} alt="amazon" className="h-6 w-auto" />
          </Link>
          <div className="ml-auto flex items-center">
            <Link to={user ? "/account" : "/signin"} className={`${navBtn} flex items-center gap-1 text-sm`}>
              {user ? `Hello, ${user.name.split(" ")[0]}` : "Sign in"} <ChevronRight size={14} /><User size={22} strokeWidth={1.8} />
            </Link>
            <CartLink count={count} label={false} />
          </div>
        </div>
        <div className="mt-2"><SearchBox compact /></div>
      </div>

      <Link to="/account" className="flex items-center gap-1.5 bg-slate-hi px-3 py-1.5 text-[13px] text-white">
        <MapPin size={16} /> Deliver to India <ChevronDown size={14} className="text-gray-300" />
      </Link>

      <nav className="bg-slate" aria-label="Departments">
        <div className="flex items-center gap-1 overflow-x-auto px-2 py-1.5 text-[13px] text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLink to="/deals" className={({ isActive }) => `${navBtn} whitespace-nowrap ${isActive ? "font-bold" : ""}`}>Today's Deals</NavLink>
          {CATEGORIES.map((c) => (
            <NavLink key={c.slug} to={`/category/${c.slug}`} className={({ isActive }) => `${navBtn} whitespace-nowrap ${isActive ? "font-bold" : ""}`}>{c.name}</NavLink>
          ))}
          {user?.role === "admin" ? <NavLink to="/admin" className={`${navBtn} whitespace-nowrap font-bold`}>Store admin</NavLink> : null}
        </div>
      </nav>
    </>
  );
}

export default function Header() {
  const { count } = useCart();
  const { user, logout } = useUser();
  const phone = useMediaQuery(PHONE);
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className="z-30 md:sticky md:top-0">
      {phone ? (
        <PhoneHeader user={user} count={count} openMenu={openMenu} />
      ) : (
        <DesktopHeader user={user} logout={logout} count={count} openMenu={openMenu} />
      )}
      <SideMenu open={menuOpen} onClose={closeMenu} />
    </header>
  );
}
