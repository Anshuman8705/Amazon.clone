import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function Toast() {
  const { toast, dismissToast } = useCart();
  if (!toast) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-lg">
        <Check size={16} className="text-pine" />
        <span className="text-sm text-ink">{toast}</span>
        <Link to="/cart" onClick={dismissToast} className="text-sm font-bold text-link hover:underline">
          View cart
        </Link>
        <button onClick={dismissToast} aria-label="Dismiss" className="rounded p-1 text-muted hover:text-ink">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
