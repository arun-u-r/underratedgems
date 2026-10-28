import { AdminMessages } from "@/components/admin/AdminMessages";

export default function AdminMessagesPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">Storefront inbox</p>
          <h1>Messages.</h1>
          <p>Contact submissions are deleted automatically after 90 days.</p>
        </div>
      </header>
      <AdminMessages />
    </div>
  );
}
