import { AdminProductEditor } from "@/components/admin/AdminProductEditor";

export default function NewProductPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">Catalogue management</p>
          <h1>New product.</h1>
        </div>
      </header>
      <AdminProductEditor />
    </div>
  );
}
