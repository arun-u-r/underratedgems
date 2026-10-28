"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  Tags,
} from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/collections", label: "Collections", icon: FolderOpen },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/messages", label: "Messages", icon: Mail },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out.");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("Sign out failed. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span>UR</span>
          <small>ADMIN STUDIO</small>
        </Link>
        <nav aria-label="Admin navigation" className="admin-nav">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/admin" && pathname.startsWith(`${href}/`));
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "admin-nav-link active" : "admin-nav-link"}
                href={href}
                key={href}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-bottom">
          <span className="admin-user-email">{email}</span>
          <button
            className="admin-logout-button"
            disabled={pending}
            onClick={logout}
            type="button"
          >
            <LogOut size={16} aria-hidden="true" />
            {pending ? "Signing out…" : "Sign out"}
          </button>
          <p aria-live="polite" className="admin-form-error">
            {error}
          </p>
          <Link className="admin-store-link" href="/">
            View storefront ↗
          </Link>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-mobile-brand">
          <Link className="admin-brand" href="/admin">
            <span>UR</span>
            <small>ADMIN</small>
          </Link>
          <button
            className="admin-mobile-logout"
            disabled={pending}
            onClick={logout}
            type="button"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
        <nav aria-label="Admin navigation" className="admin-mobile-nav">
          {links.map(({ href, label }) => (
            <Link
              aria-current={pathname === href ? "page" : undefined}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </main>
    </div>
  );
}
