import { AdminCollections } from "@/components/admin/AdminCollections";

export default function AdminCollectionsPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">Curated product edits</p>
          <h1>Collections.</h1>
          <p>Arrange products into collections and publish them when ready.</p>
        </div>
      </header>
      <AdminCollections />
    </div>
  );
}
