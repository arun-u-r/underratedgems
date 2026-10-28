import { AdminAnalytics } from "@/components/admin/AdminAnalytics";

export default function AdminAnalyticsPage() {
  return (
    <div className="admin-page">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">Measured activity</p>
          <h1>Analytics.</h1>
          <p>Outbound retailer clicks, not sales or commission data.</p>
        </div>
      </header>
      <AdminAnalytics />
    </div>
  );
}
