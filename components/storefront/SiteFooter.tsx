"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CurrentYear } from "./CurrentYear";

type FooterSettings = {
  siteName: string;
  logoUrl?: string;
  siteDescription: string;
  contactEmail?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    telegram?: string;
  };
};

const defaultSettings: FooterSettings = {
  siteName: "UR",
  logoUrl: "/ur-logo.png",
  siteDescription:
    "A considered corner of the internet for things worth knowing about.",
  socialLinks: {},
};

export function SiteFooter() {
  const pathname = usePathname();
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let active = true;
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok)
          throw new Error("Unable to load public site settings.");
        const result = (await response.json()) as { settings?: FooterSettings };
        if (active && result.settings) setSettings(result.settings);
      } catch (error) {
        console.error("Unable to load footer settings", error);
      }
    }
    void loadSettings();
    return () => {
      active = false;
    };
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  const socialLinks = Object.entries(settings.socialLinks).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].length > 0,
  );

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="brand brand--footer" href="/" aria-label="UR home">
            <Image
              alt={settings.siteName}
              className="brand-logo"
              height={55}
              src={settings.logoUrl || "/ur-logo.png"}
              width={55}
            />
            {/* {settings.logoUrl ? (
              <Image
                alt={settings.siteName}
                className="brand-logo"
                height={50}
                src={settings.logoUrl}
                width={50}
              />
            ) : (
              <span className="brand-wordmark">{settings.siteName}</span>
            )} */}
            <span className="brand-caption">THE THOUGHTFUL EDIT</span>
          </Link>
          <p>{settings.siteDescription}</p>
          {socialLinks.length > 0 && (
            <nav className="footer-social-links" aria-label="Social links">
              {socialLinks.map(([network, url]) => (
                <a
                  href={url}
                  key={network}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {network[0].toUpperCase() + network.slice(1)}
                </a>
              ))}
            </nav>
          )}
        </div>
        <div className="footer-links">
          <div>
            <span className="footer-label">Explore</span>
            <Link href="/shop">Shop the edit</Link>
            <Link href="/collections">Collections</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/about">About UR</Link>
          </div>
          <div>
            <span className="footer-label">The details</span>
            <Link href="/affiliate-disclosure">Affiliate disclosure</Link>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of use</Link>
            <Link href="/contact">Contact</Link>
            {settings.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`}>Email UR</a>
            )}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © <CurrentYear /> {settings.siteName}. All rights reserved.
        </span>
        <span>Thoughtfully found. Freely chosen.</span>
      </div>
    </footer>
  );
}
