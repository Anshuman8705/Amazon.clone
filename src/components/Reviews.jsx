import { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import Stars from "./Stars.jsx";
import Button from "./Button.jsx";
import { Field, TextInput } from "./Field.jsx";
import { useUser } from "../context/UserContext.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { api } from "../api.js";

export default function Reviews({ productId, onSaved }) {
  const { user } = useUser();
  const { data: reviews, loading, reload } = useFetch(`/products/${productId}/reviews`);
  const [form, setForm] = useState({ rating: 0, title: "", body: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const res = await api(`/products/${productId}/reviews`, { method: "POST", body: form });
      setDone(true);
      setForm({ rating: 0, title: "", body: "" });
      reload();
      onSaved?.(res.product);
    } catch (err) {
      setErrors(err.fields && Object.keys(err.fields).length ? err.fields : { body: err.message });
    } finally {
      setSaving(false);
    }
  };

  const mine = user && reviews?.find((r) => r.userId === user.id);

  return (
    <section className="mt-4 bg-white p-5" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-xl font-bold text-ink">Customer reviews</h2>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {loading && !reviews ? <p className="text-sm text-muted">Loading reviews</p> : null}
          {reviews && reviews.length === 0 ? (
            <p className="text-sm text-muted">No written reviews yet. The star rating above comes from the seeded catalogue; be the first to add one.</p>
          ) : null}
          <ul className="divide-y divide-line" data-testid="review-list">
            {(reviews || []).map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-sm font-bold text-ink">{r.title}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {r.author}{r.userId === user?.id ? " (you)" : ""}, {new Date(r.createdAt.replace(" ", "T") + "Z").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <p className="mt-1 text-sm text-ink">{r.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="h-fit rounded-lg border border-line p-4">
          {!user ? (
            <p className="text-sm text-ink">
              <Link to="/signin" className="text-link hover:underline">Sign in</Link> to write a review.
            </p>
          ) : (
            <form onSubmit={submit} noValidate>
              <h3 className="font-bold text-ink">{mine ? "Update your review" : "Write a review"}</h3>
              <div className="mt-2" role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={form.rating === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => setForm({ ...form, rating: n })}
                    className="rounded p-0.5"
                  >
                    <Star size={22} className="text-star" fill={n <= form.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                  </button>
                ))}
                {errors.rating ? <p className="text-xs text-crimson" role="alert">{errors.rating}</p> : null}
              </div>
              <div className="mt-3 space-y-3">
                <Field label="Title" id="review-title" error={errors.title}>
                  <TextInput id="review-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} maxLength={80} />
                </Field>
                <Field label="Review" id="review-body" error={errors.body}>
                  <textarea
                    id="review-body"
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    aria-invalid={errors.body ? "true" : undefined}
                    rows={4}
                    maxLength={1000}
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.body ? "border-crimson" : "border-line"}`}
                  />
                </Field>
              </div>
              <Button type="submit" className="mt-3 w-full" disabled={saving}>{saving ? "Saving" : "Submit review"}</Button>
              {done ? <p className="mt-2 text-xs text-pine" role="status">Review saved. The product rating has been updated.</p> : null}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
