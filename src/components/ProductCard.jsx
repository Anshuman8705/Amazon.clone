import { Link } from "react-router-dom";
import Stars from "./Stars.jsx";
import Price from "./Price.jsx";
import Button from "./Button.jsx";
import ProductImage from "./ProductImage.jsx";
import WishlistButton from "./WishlistButton.jsx";
import { useCart } from "../context/CartContext.jsx";
import { compact, deliveryDate } from "../utils/format.js";

export default function ProductCard({ product }) {
  const { add } = useCart();
  return (
    <article className="flex h-full flex-col" data-testid="product-card">
      <div className="relative">
        <Link to={`/product/${product.id}`} className="block rounded">
          <ProductImage product={product} />
        </Link>
        <WishlistButton product={product} className="absolute right-2 top-2" />
      </div>
      {product.discount >= 25 ? (
        <span className="mt-2 w-fit rounded bg-crimson px-2 py-0.5 text-xs font-bold text-white">
          {product.discount}% off
        </span>
      ) : null}
      <Link to={`/product/${product.id}`} className="mt-1 line-clamp-2 text-sm text-link hover:underline">
        {product.title}
      </Link>
      <div className="mt-1 flex items-center gap-1">
        <Stars value={product.rating} />
        <span className="text-xs text-link">{compact(product.reviews)}</span>
      </div>
      <div className="mt-1">
        <Price value={product.price} was={product.was} />
      </div>
      {product.prime ? (
        <p className="mt-1 text-xs text-ink">
          <span className="font-bold text-link">Free delivery</span> {deliveryDate()}
        </p>
      ) : null}
      {product.stock === 0 ? <p className="mt-1 text-xs text-crimson">Out of stock</p> : product.stock <= 8 ? <p className="mt-1 text-xs text-crimson">Only {product.stock} left in stock</p> : null}
      <div className="mt-auto pt-2">
        <Button className="w-full" disabled={product.stock === 0} onClick={() => add(product, 1)}>
          {product.stock === 0 ? "Out of stock" : "Add to cart"}
        </Button>
      </div>
    </article>
  );
}
