"use client";

import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSending(true);
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
          website: formData.get("website"),
        }),
      });
      const result = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok) {
        setMessage(result.error ?? "Your message couldn’t be sent. Try again.");
        return;
      }
      form.reset();
      setMessage("Thanks for writing. Your note has been received.");
    } catch {
      setMessage("The contact service is unavailable. Please try again later.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <label>
        Your name
        <input autoComplete="name" maxLength={120} minLength={2} name="name" required />
      </label>
      <label>
        Email address
        <input
          autoComplete="email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>
      <label>
        What’s on your mind?
        <textarea maxLength={4000} minLength={10} name="message" required />
      </label>
      <label className="contact-honeypot" aria-hidden="true">
        Website
        <input
          autoComplete="off"
          name="website"
          tabIndex={-1}
          type="text"
        />
      </label>
      <button className="button button--dark" disabled={sending} type="submit">
        {sending ? "Sending…" : "Send your note"}
      </button>
      <p aria-live="polite" className="contact-feedback">
        {message}
      </p>
    </form>
  );
}
