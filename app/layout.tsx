import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { SiteFooter } from "@/components/storefront/SiteFooter";
import { SiteHeader } from "@/components/storefront/SiteHeader";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: {
    default: "UnderRated Gems",
    template: "%s | UR",
  },
  description:
    "Discover gadgets, clever essentials, and useful finds. Explore hidden gems worth knowing about with UR Gems.",
};


export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <SiteHeader />
        </Suspense>
        <Suspense fallback={null}>{children}</Suspense>
        <Suspense fallback={null}>
          <SiteFooter />
        </Suspense>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
