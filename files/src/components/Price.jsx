import { money } from "../utils/format.js";

export default function Price({ value, was, size = "base", currency = "INR" }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <span className={`font-medium text-ink ${size === "lg" ? "text-2xl" : "text-lg"}`}>
        {money(value, currency)}
      </span>
      {Number(was) > Number(value) ? <s className="text-xs text-muted">{money(was, currency)}</s> : null}
    </span>
  );
}
