import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import { Field, TextInput } from "../components/Field.jsx";
import { useUser } from "../context/UserContext.jsx";
import { isEmail } from "../utils/validation.js";

export default function SignInPage({ mode = "signin" }) {
  const { login, register } = useUser();
  const navigate = useNavigate();
  const { state } = useLocation();
  const creating = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (creating && form.name.trim().length < 2) err.name = "Enter your name";
    if (!isEmail(form.email)) err.email = "Enter a valid email address";
    if (form.password.length < 6) err.password = "Password must be at least 6 characters";
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      if (creating) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate(state?.from || "/");
    } catch (apiErr) {
      setErrors(apiErr.fields && Object.keys(apiErr.fields).length ? apiErr.fields : { password: apiErr.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-sm px-3 py-10">
      <form onSubmit={submit} noValidate className="rounded-lg border border-line bg-white p-6">
        <h1 className="text-2xl text-ink">{creating ? "Create account" : "Sign in"}</h1>
        <div className="mt-4 space-y-3">
          {creating ? (
            <Field label="Your name" id="name" error={errors.name}>
              <TextInput id="name" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
            </Field>
          ) : null}
          <Field label="Email" id="email" error={errors.email}>
            <TextInput id="email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
          </Field>
          <Field label="Password" id="password" error={errors.password}>
            <TextInput id="password" type="password" value={form.password} onChange={set("password")} error={errors.password} autoComplete={creating ? "new-password" : "current-password"} />
          </Field>
        </div>
        <Button type="submit" className="mt-4 w-full" disabled={busy}>
          {busy ? "One moment" : creating ? "Create your account" : "Sign in"}
        </Button>
        <p className="mt-4 text-sm text-ink">
          {creating ? (
            <>Already have an account? <Link to="/signin" className="text-link hover:underline">Sign in</Link></>
          ) : (
            <>New here? <Link to="/register" className="text-link hover:underline">Create an account</Link></>
          )}
        </p>
        <p className="mt-3 text-xs text-muted">
          Passwords are hashed with bcrypt and stored in the project's SQLite database. This is a class project, so do not reuse a real password.
        </p>
      </form>
    </main>
  );
}
