import { money } from "../utils/format.js";

export default function Price({ value, was, size = "base" }) {
  const [whole, cents] = Number(value).toFixed(2).split(".");
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className={`text-ink ${size === "lg" ? "text-2xl" : "text-lg"}`}>
        <span className="align-super text-xs">$</span>
        <span className="font-medium">{whole}</span>
        <span className="align-super text-xs">{cents}</span>
      </span>
      {was ? <s className="text-xs text-muted">{money(was)}</s> : null}
    </span>
  );
}
