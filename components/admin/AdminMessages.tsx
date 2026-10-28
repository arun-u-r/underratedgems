"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";

type ContactMessage = {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchMessages() {
    const response = await fetch("/api/admin/contact", { cache: "no-store" });
    const result = (await response.json()) as {
      messages?: ContactMessage[];
      error?: string;
    };
    if (!response.ok) throw new Error(result.error ?? "Unable to load messages.");
    return result.messages ?? [];
  }

  async function load() {
    setLoading(true);
    try {
      setMessages(await fetchMessages());
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchMessages()
      .then((result) => {
        if (active) {
          setMessages(result);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Unable to load messages.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function remove(message: ContactMessage) {
    if (!window.confirm(`Delete the message from ${message.name}?`)) return;
    try {
      const response = await fetch(`/api/admin/contact/${message._id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to delete message.");
      setLoading(true);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete message.");
    }
  }

  if (loading) {
    return (
      <p className="admin-loading">
        <LoaderCircle size={18} aria-hidden="true" /> Loading messages…
      </p>
    );
  }
  return (
    <section className="admin-panel">
      <p className="admin-muted">
        Contact details are stored for up to 90 days. Reply manually by email.
      </p>
      {error && <p className="admin-error-banner">{error}</p>}
      {messages.length ? (
        <div className="admin-message-list">
          {messages.map((message) => (
            <article className="admin-message-card" key={message._id}>
              <div className="admin-message-heading">
                <div>
                  <h2>{message.name}</h2>
                  <a href={`mailto:${encodeURIComponent(message.email)}`}>
                    {message.email}
                  </a>
                </div>
                <div>
                  <time dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleString()}
                  </time>
                  <button
                    aria-label={`Delete message from ${message.name}`}
                    onClick={() => remove(message)}
                    type="button"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p>{message.message}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-empty">
          <h2>No messages.</h2>
          <p>Contact form submissions will appear here.</p>
        </div>
      )}
    </section>
  );
}
