export type AffiliateSource = "blibli" | "manual";

export type RawAffiliateProduct = {
  source: AffiliateSource;
  externalId: string;
  name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  imageUrl?: string;
  productUrl: string;
  affiliateUrl?: string;

  // Blibli marketplace signals visible in the Affiliate catalog UI.
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  rank30d?: number;
  commissionMaxIdr?: number;

  fetchedAt: string;
};

export type NormalizedProduct = RawAffiliateProduct & {
  canonicalCategory: string;
  relevanceScore: number;
  valueScore: number;
  trendScore: number;
  buyerIntentScore: number;
  economicsScore: number;
  confidenceScore: number;
  freshnessScore: number;
  contentScore: number;
  skillFusionScore: number;
  qualityGate: "PASS" | "CHECK" | "FAIL";
};
