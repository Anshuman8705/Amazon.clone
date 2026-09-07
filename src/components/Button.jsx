const variants = {
  yellow: "bg-sunny border-sunny-dark hover:bg-sunny-dark text-ink",
  orange: "bg-ember border-ember-dark hover:bg-ember-dark text-ink",
  ghost: "bg-white border-line hover:bg-gray-50 text-ink",
};

// Amazon's buttons are full pills with a thin darker border and a soft shadow.
export default function Button({ variant = "yellow", className = "", type = "button", ...rest }) {
  return (
    <button
      type={type}
      className={`rounded-full border px-4 py-1.5 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}
