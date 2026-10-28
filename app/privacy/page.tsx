import type { Metadata } from "next";
import { PageIntro } from "@/components/storefront/PageIntro";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How UR handles information when you visit or contact us.",
};

export default function PrivacyPage() {
  return (
    <main className="content-page">
      <PageIntro
        eyebrow="Your information"
        title="Privacy policy."
        description="A practical summary of what UR collects and why."
      />
      <article className="editorial-content">
        <p>
          UR collects only information needed to operate the website, respond
          to contact messages, protect administrative access, and measure
          aggregate outbound retailer clicks. UR does not process purchases.
        </p>
        <h2>Contact messages</h2>
        <p>
          If you contact us, your name, email address, and message are stored
          securely in the website database so an administrator can respond.
          Contact messages are automatically deleted after 90 days.
        </p>
        <h2>Affiliate click measurement</h2>
        <p>
          When a visitor follows an affiliate link, UR records the product,
          retailer, time, and optional source page. UR does not store the
          visitor’s full IP address. A short-lived first-party cookie helps
          avoid counting a rapid repeat click more than once.
        </p>
        <h2>Administration and cookies</h2>
        <p>
          The private admin area uses an HttpOnly session cookie necessary to
          authenticate administrators. It is not used for advertising. Basic
          server and hosting logs may be processed by the service provider
          operating UR.
        </p>
        <h2>Retailer websites</h2>
        <p>
          Following an outbound retailer link takes you to a third-party site.
          That site’s privacy policy and terms apply. UR does not control how a
          retailer handles information.
        </p>
        <h2>Your choices</h2>
        <p>
          You can choose not to send a contact message or follow an affiliate
          link. For privacy questions, use the <a href="/contact">contact page</a>.
        </p>
      </article>
    </main>
  );
}
