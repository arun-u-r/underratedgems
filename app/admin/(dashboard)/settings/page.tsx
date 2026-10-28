import { AdminSettings } from "@/components/admin/AdminSettings";

export default function AdminSettingsPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">Storefront configuration</p>
          <h1>Site settings.</h1>
          <p>Manage brand details, homepage highlights, and compliance copy.</p>
        </div>
      </header>
      <AdminSettings />
    </div>
  );
}
