import type { Metadata } from "next";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <Link className="brand" href="/" aria-label="UR home">
        <span className="brand-wordmark">UR</span>
        <span className="brand-caption">THE THOUGHTFUL EDIT</span>
      </Link>
      <div className="admin-login-card">
        <p className="eyebrow">Private area</p>
        <h1>Welcome back.</h1>
        <p>Sign in to manage the UR edit.</p>
        <AdminLoginForm />
      </div>
      <Link className="admin-back-link" href="/">
        Back to the storefront
      </Link>
    </main>
  );
}
