import assert from "node:assert/strict";
import test from "node:test";
import { validateAffiliateUrl } from "../lib/affiliate.ts";
import {
  contactInputSchema,
  loginInputSchema,
  paginationSchema,
  settingsInputSchema,
} from "../lib/validation.ts";
import { getEnvironment } from "../lib/env.ts";

test("retailer URLs must use approved public retailer hosts", () => {
  assert.equal(validateAffiliateUrl("https://www.amazon.in/dp/example"), true);
  assert.equal(validateAffiliateUrl("https://www.meesho.com/example"), true);
  assert.equal(validateAffiliateUrl("https://example.org/offer"), false);
  assert.equal(validateAffiliateUrl("http://127.0.0.1/admin"), false);
  assert.equal(validateAffiliateUrl("javascript:alert(1)"), false);
  assert.equal(validateAffiliateUrl("https://amazon.in@attacker.example/"), false);
});

test("catalogue pagination rejects unbounded or invalid limits", () => {
  assert.equal(paginationSchema.parse({ page: "2", limit: "24" }).page, 2);
  assert.equal(paginationSchema.safeParse({ limit: "500" }).success, false);
  assert.equal(paginationSchema.safeParse({ page: "0" }).success, false);
});

test("authentication and contact inputs reject malformed values", () => {
  assert.equal(
    loginInputSchema.safeParse({ email: "not-email", password: "x" }).success,
    false,
  );
  assert.equal(
    contactInputSchema.safeParse({
      name: "A",
      email: "not-email",
      message: "Too short",
    }).success,
    false,
  );
});

test("public site links reject non-HTTP protocols", () => {
  const settings = {
    siteName: "UR",
    siteDescription: "Thoughtful discoveries.",
    logoUrl: "",
    heroHeadline: "Good things, thoughtfully found.",
    heroSubtitle: "",
    affiliateDisclosure:
      "Some links are affiliate links. As an Amazon Associate I earn from qualifying purchases.",
    contactEmail: "",
    socialLinks: {
      instagram: "javascript:alert(1)",
      facebook: "",
      telegram: "",
    },
  };
  assert.equal(settingsInputSchema.safeParse(settings).success, false);
  assert.equal(
    settingsInputSchema.safeParse({
      ...settings,
      socialLinks: { ...settings.socialLinks, instagram: "https://example.com/ur" },
    }).success,
    true,
  );
});

test("a short bootstrap password does not invalidate runtime configuration", () => {
  const previousPassword = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = "short";
  try {
    assert.equal(getEnvironment().ADMIN_PASSWORD, "short");
  } finally {
    if (previousPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = previousPassword;
    }
  }
});
