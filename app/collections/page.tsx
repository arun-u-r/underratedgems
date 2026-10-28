import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageIntro } from "@/components/storefront/PageIntro";
import { StoreStatus } from "@/components/storefront/StoreStatus";
import { listPublicCollections } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore curated UR collections and thoughtful product edits.",
};

export default function CollectionsPage() {
  return (
    <Suspense fallback={<main className="content-page">Loading collections…</main>}>
      <CollectionsContent />
    </Suspense>
  );
}

async function CollectionsContent() {
  await connection();
  let collections = null;
  try {
    collections = await listPublicCollections();
  } catch (error) {
    console.error("Unable to load collections", error);
  }
  if (collections === null) {
    return (
      <main className="content-page">
        <PageIntro eyebrow="Curated" title="Collections." />
        <StoreStatus
          title="The catalogue isn’t connected yet."
          message="Connect MongoDB to publish curated collections."
        />
      </main>
    );
  }
  return (
    <main className="content-page">
      <PageIntro
        eyebrow="A considered edit"
        title="Collections."
        description="Ideas gathered around a feeling, a moment, or a small discovery."
      />
      {collections.length ? (
        <div className="collection-grid">
          {collections.map((collection) => (
            <Link
              className="collection-tile"
              href={`/collections/${collection.slug}`}
              key={String(collection._id)}
            >
              <span>CURATED BY UR</span>
              <span>
                <h2>{collection.title}</h2>
                <p>{collection.description}</p>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <StoreStatus
          title="A few good collections are on the way."
          message="Published collections will appear here as they’re curated."
        />
      )}
    </main>
  );
}
