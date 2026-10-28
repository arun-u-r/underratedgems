"use client";

import { useState } from "react";

export function ShareProduct({ title }: { title: string }) {
  const [message, setMessage] = useState("");

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch {
      setMessage("Sharing isn’t available in this browser.");
    }
  }

  return (
    <div className="share-row">
      <button onClick={share} type="button">
        Share this discovery
      </button>
      <span aria-live="polite">{message}</span>
    </div>
  );
}
