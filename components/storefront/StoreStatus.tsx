export function StoreStatus({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="store-status" role="status">
      <p className="eyebrow">UR / A NOTE</p>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}
