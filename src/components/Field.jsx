export function Field({ label, error, id, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-crimson" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ error, className = "", ...props }) {
  return (
    <input
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? `${props.id}-error` : undefined}
      className={`w-full rounded border px-3 py-2 text-sm shadow-inner ${error ? "border-crimson" : "border-line"} ${className}`}
      {...props}
    />
  );
}
