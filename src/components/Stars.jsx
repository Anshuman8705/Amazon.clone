import { Star } from "lucide-react";

export default function Stars({ value, size = 14 }) {
  return (
    <span className="inline-flex items-center" aria-label={`${value} out of 5 stars`} title={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className="text-star"
          fill={i <= Math.round(value) ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}
