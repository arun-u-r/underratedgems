"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search, X } from "lucide-react";

const categoryLinks = [
  { label: "Home & living", href: "/categories" },
  { label: "Personal style", href: "/categories" },
  { label: "Everyday details", href: "/categories" },
];

const primaryLinks = [
  { label: "Shop all", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [brand, setBrand] = useState({
    siteName: "UR",
    logoUrl: "/ur-logo.png",
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mobileMenuId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const categoryToggleRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    async function loadBrand() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok)
          throw new Error("Unable to load public brand settings.");
        const result = (await response.json()) as {
          settings?: { siteName?: string; logoUrl?: string };
        };
        if (active && result.settings) {
          setBrand({
            siteName: result.settings.siteName || "UR",
            logoUrl: result.settings.logoUrl || "/ur-logo.png",
          });
        }
      } catch (error) {
        console.error("Unable to load header settings", error);
      }
    }
    if (!pathname.startsWith("/admin")) void loadBrand();
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstLink = menuRef.current?.querySelector<HTMLElement>(
      "a, button:not([disabled])",
    );
    firstLink?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || !menuRef.current) return;
      const focusable = menuRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([disabled])",
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    function handleViewportChange(event: MediaQueryListEvent) {
      if (event.matches) {
        previousFocusRef.current = null;
        setMenuOpen(false);
      }
    }

    const desktopViewport = window.matchMedia("(min-width: 48rem)");
    desktopViewport.addEventListener("change", handleViewportChange);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      desktopViewport.removeEventListener("change", handleViewportChange);
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus();
      }
    };
  }, [menuOpen]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (searchOpen) searchToggleRef.current?.focus();
        else if (categoriesOpen) categoryToggleRef.current?.focus();
        setCategoriesOpen(false);
        setSearchOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [categoriesOpen, searchOpen]);

  function toggleMenu() {
    if (!menuOpen) {
      previousFocusRef.current = menuButtonRef.current;
      setSearchOpen(false);
      setCategoriesOpen(false);
    }
    setMenuOpen((open) => !open);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="UR home">
          <Image
            alt={brand.siteName}
            className="brand-logo"
            height={42}
            src={brand.logoUrl}
            width={42}
            priority
          />
          {/* {brand.logoUrl ? (
            <Image
              alt={brand.siteName}
              className="brand-logo"
              height={48}
              src={brand.logoUrl}
              width={48}
              priority
            />
          ) : (
            <span className="brand-wordmark">{brand.siteName}</span>
          )} */}
          <span className="brand-caption">THE THOUGHTFUL EDIT</span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          <Link className="nav-link" href="/">
            Home
          </Link>
          <Link className="nav-link" href="/shop">
            Shop all
          </Link>
          <div className="nav-dropdown">
            <button
              className="nav-link nav-dropdown-trigger"
              type="button"
              aria-expanded={categoriesOpen}
              aria-controls="category-menu"
              onClick={() => setCategoriesOpen((open) => !open)}
              ref={categoryToggleRef}
            >
              Categories
              <ChevronDown
                className={categoriesOpen ? "chevron-open" : ""}
                size={14}
                aria-hidden="true"
              />
            </button>
            {categoriesOpen && (
              <div className="category-menu" id="category-menu">
                <span className="category-menu-label">Explore by mood</span>
                {categoryLinks.map((category) => (
                  <Link
                    href={category.href}
                    key={category.label}
                    onClick={() => setCategoriesOpen(false)}
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link className="nav-link" href="/collections">
            Collections
          </Link>
          <Link className="nav-link" href="/about">
            About
          </Link>
        </nav>

        <div className="header-actions">
          <Link className="featured-link" href="/collections">
            The latest edit <span aria-hidden="true">↗</span>
          </Link>
          <button
            className="icon-button search-toggle"
            type="button"
            aria-label={searchOpen ? "Close search" : "Open search"}
            aria-expanded={searchOpen}
            aria-controls="site-search"
            ref={searchToggleRef}
            onClick={() => {
              setSearchOpen((open) => !open);
              previousFocusRef.current = null;
              setMenuOpen(false);
              setCategoriesOpen(false);
            }}
          >
            {searchOpen ? (
              <X size={19} aria-hidden="true" />
            ) : (
              <Search size={19} aria-hidden="true" />
            )}
          </button>
          <button
            className="icon-button mobile-menu-toggle"
            type="button"
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls={mobileMenuId}
            onClick={toggleMenu}
            ref={menuButtonRef}
          >
            {menuOpen ? (
              <X size={21} aria-hidden="true" />
            ) : (
              <Menu size={21} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="search-panel" id="site-search">
          <form action="/shop" className="search-form" role="search">
            <Search size={18} aria-hidden="true" />
            <label className="sr-only" htmlFor="site-search-input">
              Search the UR edit
            </label>
            <input
              id="site-search-input"
              name="q"
              placeholder="What are you looking for?"
              ref={searchInputRef}
              type="search"
            />
            <button className="search-submit" type="submit">
              Search
            </button>
          </form>
        </div>
      )}

      {menuOpen && (
        <div className="mobile-menu-layer">
          <button
            aria-label="Close navigation menu"
            className="mobile-menu-backdrop"
            onClick={closeMenu}
            tabIndex={-1}
            type="button"
          />
          <div
            aria-label="Mobile navigation"
            aria-modal="true"
            className="mobile-menu-panel"
            id={mobileMenuId}
            ref={menuRef}
            role="dialog"
          >
            <div className="mobile-menu-heading">
              <span>Find your next good thing.</span>
              <button
                aria-label="Close navigation menu"
                className="icon-button"
                onClick={closeMenu}
                type="button"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <nav
              aria-label="Mobile main navigation"
              className="mobile-nav-links"
            >
              <Link href="/" onClick={closeMenu}>
                Home <span>01</span>
              </Link>
              {primaryLinks.map((link, index) => (
                <Link href={link.href} key={link.label} onClick={closeMenu}>
                  {link.label} <span>0{index + 2}</span>
                </Link>
              ))}
            </nav>
            <div className="mobile-menu-categories">
              <span className="category-menu-label">Browse categories</span>
              {categoryLinks.map((category) => (
                <Link
                  href={category.href}
                  key={category.label}
                  onClick={closeMenu}
                >
                  {category.label}
                </Link>
              ))}
            </div>
            <p className="mobile-menu-note">Good things, thoughtfully found.</p>
          </div>
        </div>
      )}
    </header>
  );
}
