import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentAdmin } from "@/lib/auth";

export default function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense
      fallback={
        <main className="admin-unavailable">
          <p>Checking your administrator session…</p>
        </main>
      }
    >
      <AuthenticatedAdmin>{children}</AuthenticatedAdmin>
    </Suspense>
  );
}

async function AuthenticatedAdmin({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  let admin = null;
  let sessionCheckFailed = false;
  try {
    admin = await getCurrentAdmin();
  } catch (error) {
    console.error("Unable to verify admin session", error);
    sessionCheckFailed = true;
  }
  if (sessionCheckFailed) {
    return (
      <main className="admin-unavailable">
        <h1>Admin service unavailable.</h1>
        <p>Check MongoDB and session configuration, then reload this page.</p>
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="admin-unavailable">
        <h1>Sign in required.</h1>
        <p>Your administrator session is missing or has expired.</p>
        <Link className="admin-primary-button" href="/admin/login">
          Go to administrator sign in
        </Link>
      </main>
    );
  }
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
