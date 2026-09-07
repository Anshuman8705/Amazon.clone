import { Heart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

export default function WishlistButton({ product, className = "" }) {
  const { user } = useUser();
  const { has, toggle } = useWishlist();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const saved = user && has(product.id);

  return (
    <button
      type="button"
      onClick={() => (user ? toggle(product) : navigate("/signin", { state: { from: pathname } }))}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={Boolean(saved)}
      title={saved ? "Saved to your wishlist" : "Save for later"}
      className={`rounded-full border border-line bg-white p-1.5 shadow-sm hover:bg-gray-50 ${className}`}
    >
      <Heart size={16} className={saved ? "text-crimson" : "text-muted"} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
