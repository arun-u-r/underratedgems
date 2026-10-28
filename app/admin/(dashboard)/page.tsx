import { AdminOverview } from "@/components/admin/AdminOverview";
export const instant = false;


export default function AdminHomePage() {
  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">UR / Admin studio</p>
          <h1>Good afternoon.</h1>
          <p>Here’s what’s happening across your discovery edit.</p>
        </div>
      </header>
      <AdminOverview />
    </div>
  );
}
