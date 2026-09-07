import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { useUser } from "./UserContext.jsx";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useUser();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    api("/wishlist").then(setItems).catch(() => setItems([]));
  }, [user]);

  const value = useMemo(() => ({
    items,
    has: (id) => items.some((p) => p.id === id),
    toggle: async (product) => {
      if (items.some((p) => p.id === product.id)) setItems(await api(`/wishlist/${product.id}`, { method: "DELETE" }));
      else setItems(await api("/wishlist", { method: "POST", body: { productId: product.id } }));
    },
    remove: async (id) => setItems(await api(`/wishlist/${id}`, { method: "DELETE" })),
  }), [items]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
