import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageIntro } from "@/components/storefront/PageIntro";
import { connectToDatabase } from "@/lib/db";
import { SiteSettings } from "@/lib/models";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description: "How affiliate links and retailer relationships work at UR.",
};

export default function AffiliateDisclosurePage() {
  return (
    <Suspense fallback={<main className="content-page">Loading disclosure…</main>}>
      <AffiliateDisclosureContent />
    </Suspense>
  );
}

async function AffiliateDisclosureContent() {
  await connection();
  let disclosure =
    "Some links may be affiliate links. As an Amazon Associate I earn from qualifying purchases.";
  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "main" })
      .select("affiliateDisclosure")
      .lean();
    if (settings?.affiliateDisclosure) {
      disclosure = settings.affiliateDisclosure;
    }
  } catch (error) {
    console.error("Unable to load affiliate disclosure settings", error);
  }

  return (
    <main className="content-page">
      <PageIntro
        eyebrow="The important details"
        title="Affiliate disclosure."
        description="A clear note on how UR’s retailer links work."
      />
      <article className="editorial-content">
        <p>
          UR is an affiliate product discovery website, not a retailer. We do
          not process payments, own inventory, or handle shipping or returns.
          When you follow an outbound link, you visit the retailer’s website and
          their terms and privacy practices apply.
        </p>
        <p>
          {disclosure}
        </p>
        <p>
          Retailer prices, availability, product information, and policies may
          change. Any price displayed on UR is manually verified and shows when
          it was last checked; please confirm current information on the
          retailer’s site before purchasing.
        </p>
      </article>
    </main>
  );
}
