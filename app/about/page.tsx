import type { Metadata } from "next";
import { PageIntro } from "@/components/storefront/PageIntro";

export const metadata: Metadata = {
  title: "About UR",
  description: "Learn about UR, an independent guide to thoughtfully chosen discoveries.",
};

export default function AboutPage() {
  return (
    <main className="content-page">
      <PageIntro
        eyebrow="A note from UR"
        title="More considered. Less noise."
        description="UR is an independent guide to things we think are worth a closer look."
      />
      <article className="editorial-content">
        <p>
          The internet is full of choices. UR exists to make discovery feel a
          little more human: a considered place to explore products and
          collections that can make everyday routines, spaces, and moments feel
          more like your own.
        </p>
        <h2>Curiosity, with care.</h2>
        <p>
          We bring together product information, useful details, and links to
          participating retailers. We don’t make, stock, ship, or sell these
          products. Retailers are responsible for their own product information,
          prices, availability, checkout, and fulfilment.
        </p>
        <h2>How UR earns.</h2>
        <p>
          Some retailer links may be affiliate links. If you choose to shop
          through one, UR may earn a commission at no additional cost to you.
          That relationship doesn’t change the price you pay, and it doesn’t
          replace your own research or judgement.
        </p>
        <p>
          We aim to describe only the information available to us and to make
          affiliate relationships visible. Prices, if shown, include when they
          were last checked and should always be confirmed with the retailer.
        </p>
      </article>
    </main>
  );
}
