export type AffiliateSource = "involve-asia" | "manual";

export type RawAffiliateProduct = {
  source: AffiliateSource;
  externalId: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  imageUrl?: string;
  productUrl: string;
  affiliateUrl?: string;
  rating?: number;
  reviewCount?: number;
  commissionRate?: number;
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
