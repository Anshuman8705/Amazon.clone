// Renders the product photo when one exists, otherwise a small SVG
// illustration so a missing image never shows as a broken icon.

const palettes = [
  ["#2B4C7E", "#567EBB", "#DCE6F2"],
  ["#7A4A2B", "#C08552", "#F3E3D3"],
  ["#1F5F52", "#4E9C87", "#DCEDE7"],
];

function Art({ kind, tone = 0 }) {
  const [dark, mid, light] = palettes[tone % palettes.length];
  const shapes = {
    bowl: (
      <>
        <path d="M56 122h128c0 40-28 66-64 66s-64-26-64-66z" fill={mid} />
        <ellipse cx="120" cy="122" rx="64" ry="18" fill={light} />
        <circle cx="100" cy="118" r="9" fill={dark} />
        <circle cx="132" cy="124" r="7" fill={dark} />
      </>
    ),
    fountain: (
      <>
        <rect x="98" y="44" width="44" height="24" rx="6" fill={dark} />
        <path d="M92 68h56v106a22 22 0 01-22 22h-12a22 22 0 01-22-22z" fill={mid} />
        <rect x="92" y="112" width="56" height="36" fill={light} />
      </>
    ),
    speaker: (
      <>
        <rect x="78" y="46" width="84" height="150" rx="20" fill={dark} />
        <circle cx="120" cy="90" r="20" fill={light} />
        <circle cx="120" cy="150" r="30" fill={mid} />
        <circle cx="120" cy="150" r="12" fill={light} />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden="true">
      <rect width="240" height="240" fill="#fff" />
      <circle cx="120" cy="120" r="96" fill={light} opacity="0.45" />
      {shapes[kind] || shapes.bowl}
    </svg>
  );
}

// `fit` is "cover" for cards and tiles (a tidy, uniform grid) and "contain"
// on the product page, where the whole item should be visible.
export default function ProductImage({ product, className = "", tone = 0, fit = "cover" }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <div className={`flex aspect-[4/3] items-center justify-center overflow-hidden rounded bg-white ${className}`}>
      {product.image ? (
        <img
          src={/^https?:\/\//.test(product.image) ? product.image : `${base}${product.image}`}
          alt={product.title}
          loading="lazy"
          className={`h-full w-full ${fit === "contain" ? "object-contain p-2" : "object-cover"}`}
        />
      ) : (
        <Art kind={product.art} tone={tone} />
      )}
    </div>
  );
}
