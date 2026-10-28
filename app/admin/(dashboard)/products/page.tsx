import Link from "next/link";
import { AdminProducts } from "@/components/admin/AdminProducts";

export default function AdminProductsPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">Catalogue management</p>
          <h1>Products.</h1>
          <p>Draft, review, publish, and archive product discoveries.</p>
        </div>
        <Link className="admin-primary-button admin-heading-action" href="/admin/products/new">
          Create product
        </Link>
      </header>
      <AdminProducts />
    </div>
  );
}
