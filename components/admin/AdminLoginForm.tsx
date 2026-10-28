"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Unable to sign in. Please try again.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("The authentication service is unavailable.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label>
        Email
        <input
          autoComplete="username"
          autoFocus
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>
      <label>
        Password
        <input
          autoComplete="current-password"
          maxLength={200}
          name="password"
          required
          type="password"
        />
      </label>
      <p aria-live="polite" className="admin-form-error">
        {error}
      </p>
      <button className="button button--dark" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
