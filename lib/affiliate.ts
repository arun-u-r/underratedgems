import { getEnvironment } from "./env.ts";

const defaultRetailerHosts = [
  "amazon.com",
  "amazon.in",
  "meesho.com",
];

function normalizeHost(host: string) {
  return host.trim().toLowerCase().replace(/^\*\./, "");
}

export function getAllowedRetailerHosts() {
  const configured = process.env.AFFILIATE_ALLOWED_HOSTS?.split(",")
    .map(normalizeHost)
    .filter(Boolean);
  return configured?.length ? configured : defaultRetailerHosts;
}

function isPublicHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0" ||
    host === "::" ||
    host === "::1"
  ) {
    return false;
  }

  return !host.includes(":") && !/^\d+(?:\.\d+){0,3}$/.test(host);
}

export function validateAffiliateUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return false;
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    !isPublicHost(url.hostname)
  ) {
    return false;
  }

  const host = url.hostname.toLowerCase();
  return getAllowedRetailerHosts().some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

export function validateOutboundUrl(input: string) {
  const siteUrl = getEnvironment().NEXT_PUBLIC_SITE_URL;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return false;
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    !isPublicHost(url.hostname)
  ) {
    return false;
  }

  if (siteUrl && url.origin === new URL(siteUrl).origin) return false;
  return true;
}
