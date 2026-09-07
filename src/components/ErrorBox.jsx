import { AlertTriangle } from "lucide-react";
import Button from "./Button.jsx";

export default function ErrorBox({ error, onRetry }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded border border-crimson bg-red-50 p-4 text-sm text-ink">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-crimson" />
      <div>
        <p className="font-bold">{error?.message || "Something went wrong"}</p>
        {error?.status === 0 ? <p className="mt-1 text-muted">Start the API with <code>npm run dev</code> and refresh.</p> : null}
        {onRetry ? <Button variant="ghost" className="mt-3" onClick={onRetry}>Try again</Button> : null}
      </div>
    </div>
  );
}
