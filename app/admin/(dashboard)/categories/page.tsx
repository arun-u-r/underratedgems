import { AdminCategories } from "@/components/admin/AdminCategories";

export default function AdminCategoriesPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">Catalogue structure</p>
          <h1>Categories.</h1>
          <p>Organize products and choose the order visitors see them.</p>
        </div>
      </header>
      <AdminCategories />
    </div>
  );
}
