import type { Metadata } from "next";
import { ContactForm } from "@/components/storefront/ContactForm";
import { PageIntro } from "@/components/storefront/PageIntro";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the UR team.",
};

export default function ContactPage() {
  return (
    <main className="content-page">
      <PageIntro
        eyebrow="Say hello"
        title="We’re listening."
        description="Questions, corrections, or something good you think we should know about? Send us a note."
      />
      <ContactForm />
    </main>
  );
}
