import { AdminProductEditor } from "@/components/admin/AdminProductEditor";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">Catalogue management</p>
          <h1>Edit product.</h1>
        </div>
      </header>
      <AdminProductEditor productId={id} />
    </div>
  );
}
