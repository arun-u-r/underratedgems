import type { Metadata } from "next";
import { PageIntro } from "@/components/storefront/PageIntro";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using the UR product discovery website.",
};

export default function TermsPage() {
  return (
    <main className="content-page">
      <PageIntro eyebrow="The ground rules" title="Terms of use." />
      <article className="editorial-content">
        <p>
          UR provides editorial product discovery and links to independent
          retailers. UR is not the seller of products shown on this site and
          does not process payments, manage inventory, arrange delivery, or
          handle returns.
        </p>
        <h2>Product information</h2>
        <p>
          Product descriptions are provided for general information. Retailers
          control final product details, price, stock, checkout, warranties, and
          fulfilment. Confirm all current terms with the retailer before making
          a decision.
        </p>
        <h2>Affiliate relationships</h2>
        <p>
          Some links may be affiliate links. UR may earn a commission from
          qualifying purchases at no extra cost to you. See the{" "}
          <a href="/affiliate-disclosure">affiliate disclosure</a>.
        </p>
        <h2>Use of the site</h2>
        <p>
          Please use UR lawfully and do not attempt to disrupt the website,
          bypass access controls, or misuse its content or services. Website
          content is provided as-is and may be updated or removed.
        </p>
      </article>
    </main>
  );
}
