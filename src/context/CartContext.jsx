import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback } from "react";
import { api } from "../api.js";
import { load, save } from "../utils/storage.js";
import { useUser } from "./UserContext.jsx";

export const MAX_QTY = 10;
const STORAGE_KEY = "amazon-clone:cart";
const GUEST_ORDERS_KEY = "amazon-clone:guest-orders";

// Cart lines are {id, qty}. Product details are fetched from the API and
// cached in `catalog` so prices and stock are always the server's numbers.
export function cartReducer(state, action) {
  switch (action.type) {
    case "replace":
      return action.lines.filter((l) => l.qty > 0).map((l) => ({ id: Number(l.id), qty: Math.min(l.qty, MAX_QTY) }));
    case "add": {
      const qty = Math.max(1, action.qty || 1);
      const line = state.find((l) => l.id === action.id);
      if (line) return state.map((l) => (l.id === action.id ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l));
      return [...state, { id: action.id, qty: Math.min(qty, MAX_QTY) }];
    }
    case "setQty":
      if (action.qty < 1) return state.filter((l) => l.id !== action.id);
      return state.map((l) => (l.id === action.id ? { ...l, qty: Math.min(action.qty, MAX_QTY) } : l));
    case "remove":
      return state.filter((l) => l.id !== action.id);
    case "clear":
      return [];
    default:
      return state;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, authSource } = useUser();
  const [lines, dispatch] = useReducer(cartReducer, undefined, () => load(STORAGE_KEY, []));
  const [catalog, setCatalog] = useState({});
  const [guestOrders, setGuestOrders] = useState(() => load(GUEST_ORDERS_KEY, []));
  const [toast, setToast] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const timer = useRef(null);
  const lastUser = useRef(null);
  const skipNextSync = useRef(false);

  useEffect(() => save(STORAGE_KEY, lines), [lines]);
  useEffect(() => save(GUEST_ORDERS_KEY, guestOrders), [guestOrders]);
  useEffect(() => () => clearTimeout(timer.current), []);

  // On a fresh sign-in, merge whatever they had as a guest into the account
  // cart. On a restored session (page reload) the server copy is the truth,
  // so adopt it as-is rather than merging the local copy back in.
  useEffect(() => {
    const id = user?.id || null;
    if (id === lastUser.current) return;
    lastUser.current = id;
    if (!id) return;
    setSyncing(true);
    const sync = authSource === "restored" ? api("/cart") : api("/cart/merge", { method: "POST", body: { lines } });
    sync
      .then((serverLines) => {
        skipNextSync.current = true;
        dispatch({ type: "replace", lines: serverLines });
      })
      .catch(() => {})
      .finally(() => setSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Every change while signed in is pushed to the server.
  useEffect(() => {
    if (!user) return;
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    api("/cart", { method: "PUT", body: { lines } }).catch(() => {});
  }, [lines, user]);

  // Keep product details for every line in the cart fresh.
  const ids = lines.map((l) => l.id).sort((a, b) => a - b).join(",");
  const refreshCatalog = useCallback(() => {
    if (!ids) return;
    Promise.all(ids.split(",").map((id) => api(`/products/${id}`).catch(() => null))).then((products) => {
      setCatalog((c) => {
        const next = { ...c };
        products.forEach((p) => { if (p) next[p.id] = p; });
        return next;
      });
    });
  }, [ids]);
  useEffect(() => { refreshCatalog(); }, [refreshCatalog]);

  const value = useMemo(() => {
    const items = lines.map((l) => (catalog[l.id] ? { ...catalog[l.id], qty: l.qty } : { id: l.id, qty: l.qty, pending: true }));
    const subtotal = items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);

    const showToast = (message) => {
      setToast(message);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), 2600);
    };

    return {
      lines,
      items,
      subtotal,
      count,
      syncing,
      toast,
      guestOrders,
      dismissToast: () => setToast(null),
      add: (product, qty = 1, { silent = false } = {}) => {
        setCatalog((c) => ({ ...c, [product.id]: product }));
        dispatch({ type: "add", id: product.id, qty });
        if (!silent) showToast(`${product.title.length > 48 ? `${product.title.slice(0, 48)}…` : product.title} added to cart`);
      },
      setQty: (id, qty) => dispatch({ type: "setQty", id, qty }),
      remove: (id) => dispatch({ type: "remove", id }),
      clear: () => dispatch({ type: "clear" }),
      refresh: refreshCatalog,
      placeOrder: async (customer) => {
        const order = await api("/orders", { method: "POST", body: { customer, lines } });
        dispatch({ type: "clear" });
        if (!user) setGuestOrders((g) => [order.id, ...g].slice(0, 20));
        return order;
      },
    };
  }, [lines, catalog, syncing, toast, guestOrders, refreshCatalog, user]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
