import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { connectToDatabase } from "@/lib/db";
import { SiteSettings } from "@/lib/models";
import { getHomepageContent, type HomepageContent } from "@/lib/public-data";

const edits = [
  {
    number: "01",
    id: "home-edit",
    title: "A calmer everyday",
    description: "Useful little upgrades for the spaces you call home.",
    className: "edit-card--home",
  },
  {
    number: "02",
    id: "style-edit",
    title: "Personal, not ordinary",
    description: "Considered finds that make getting ready feel like you.",
    className: "edit-card--style",
  },
  {
    number: "03",
    id: "details-edit",
    title: "The finishing touch",
    description: "Thoughtful details, chosen to bring it all together.",
    className: "edit-card--details",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "main" })
      .select("siteName siteDescription seoTitle seoDescription")
      .lean();
    if (!settings) return {};
    return {
      title: settings.seoTitle || settings.siteName,
      description: settings.seoDescription || settings.siteDescription,
    };
  } catch (error) {
    console.error("Unable to load homepage metadata", error);
    return {};
  }
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="content-page">
          <p className="eyebrow">Loading the UR finds…</p>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  await connection();
  let settings: HomepageContent | null = null;
  try {
    await connection();
    settings = await getHomepageContent();
  } catch (error) {
    console.error("Unable to load homepage settings", error);
  }
  const headlineText =
    settings?.heroHeadline ?? "Good things, thoughtfully found.";
  const headlineSeparator = headlineText.indexOf(",");
  const headlineFirst =
    headlineSeparator < 0
      ? headlineText
      : headlineText.slice(0, headlineSeparator);
  const headlineSecond =
    headlineSeparator < 0 ? "" : headlineText.slice(headlineSeparator + 1).trim();

  return (
    <>
      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              A little more considered
            </p>
            <h1 id="hero-title">
              {headlineFirst}
              {headlineSecond && ","}
              {headlineSecond && (
                <>
                  <br />
                  <span>{headlineSecond}</span>
                </>
              )}
            </h1>
            <p className="hero-description">
              {settings?.heroSubtitle ??
                "A growing edit of things worth knowing about, chosen to make everyday life feel a little more like yours."}
            </p>
            <div className="hero-actions">
              <Link className="button button--dark" href="#discover">
                Explore the edit <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a className="text-link" href="#our-approach">
                Get to know UR
              </a>
            </div>
            <a className="hero-scroll" href="#discover" aria-label="Scroll to discover">
              <span>Scroll to discover</span>
              <ArrowDown size={15} aria-hidden="true" />
            </a>
          </div>

          <div className="hero-art">
            <div className="hero-art-note">
              <span>THE UR FINDS</span>
              <span>NO. 001 — ALWAYS IN SEASON</span>
            </div>
            {settings?.heroImage ? (
              <Image
                src={settings.heroImage.url}
                alt={settings.heroImage.alt}
                width={720}
                height={780}
                priority
                className="hero-illustration hero-uploaded-image"
              />
            ) : (
              <Image
                src="/hero-still-life.svg"
                alt=""
                width={720}
                height={780}
                priority
                className="hero-illustration"
              />
            )}
            <div className="hero-art-caption">
              <span>Small discoveries.</span>
              <span>Good things that stay.</span>
            </div>
          </div>
          <div className="hero-index" aria-hidden="true">
            UR / 001
          </div>
        </section>

        <section className="discovery-section section-wrap" id="discover">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A place to begin</p>
              <h2>Find your kind of good.</h2>
            </div>
            <p className="section-intro">
              Thoughtful picks for all the different corners of everyday life.
            </p>
          </div>
          <div className="edit-grid">
            {settings?.featuredCategories.length
              ? settings.featuredCategories.map((category, index) => (
                  <Link
                    className={`edit-card ${edits[index % edits.length].className}`}
                    href={`/categories/${category.slug}`}
                    key={category.id}
                  >
                    <span className="edit-number">
                      {String(index + 1).padStart(2, "0")} /{" "}
                      {String(settings.featuredCategories.length).padStart(2, "0")}
                    </span>
                    <span className="edit-card-bottom">
                      <span>
                        <span className="edit-title">{category.name}</span>
                        <span className="edit-description">
                          Explore the {category.name.toLowerCase()} edit.
                        </span>
                      </span>
                      <span className="edit-arrow" aria-hidden="true">
                        <ArrowRight size={18} />
                      </span>
                    </span>
                  </Link>
                ))
              : edits.map((edit) => (
              <article
                className={`edit-card ${edit.className}`}
                id={edit.id}
                key={edit.number}
              >
                <span className="edit-number">{edit.number} / 03</span>
                <span className="edit-card-bottom">
                  <span>
                    <span className="edit-title">{edit.title}</span>
                    <span className="edit-description">{edit.description}</span>
                  </span>
                </span>
              </article>
              ))}
          </div>
        </section>

        {settings?.featuredProducts.length ? (
          <section className="featured-product-section section-wrap">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Chosen by UR</p>
                <h2>Worth a closer look.</h2>
              </div>
              <Link className="text-link" href="/shop">
                Shop all discoveries <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="product-grid">
              {settings.featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : null}

        {settings?.featuredCollections.length ? (
          <section className="featured-collections-section section-wrap">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Gathered with care</p>
                <h2>Curated collections.</h2>
              </div>
            </div>
            <div className="collection-grid">
              {settings.featuredCollections.map((collection) => (
                <Link
                  className="collection-tile"
                  href={`/collections/${collection.slug}`}
                  key={collection.id}
                >
                  <span>CURATED BY UR</span>
                  <span>
                    <h2>{collection.title}</h2>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="approach-section" id="our-approach">
          <div className="approach-mark" aria-hidden="true">
            UR
          </div>
          <div className="approach-copy">
            <p className="eyebrow">A note on what we do</p>
            <h2>Less endless scrolling. More things that feel right.</h2>
            <p>
              UR is an independent guide to things we think are worth a closer
              look. We bring useful finds together so you can spend less time
              searching and more time choosing what works for you.
            </p>
            <a className="text-link text-link--dark" href="#affiliate-disclosure">
              How our recommendations work <ArrowRight size={15} aria-hidden="true" />
            </a>
          </div>
          <div className="approach-aside" aria-hidden="true">
            <span>CURIOUS BY NATURE.</span>
            <span>THOUGHTFUL BY CHOICE.</span>
          </div>
        </section>

        <section
          className="disclosure-strip"
          id="affiliate-disclosure"
          aria-label="Affiliate disclosure"
        >
          <p>
            {settings?.affiliateDisclosure ??
              "Some links may be affiliate links. As an Amazon Associate I earn from qualifying purchases."}
          </p>
          <span>Always your choice.</span>
        </section>
      </main>
    </>
  );
}
