export type ProductIdentity = {
  canonicalProductId?: string | null;
  canonicalUrl?: string | null;
  affiliateUrl?: string | null;
  name?: string | null;
  brand?: string | null;
};

export type DuplicateStatus =
  | "UNIQUE"
  | "DUPLICATE"
  | "POSSIBLE_DUPLICATE";

export type DuplicateReason =
  | "PRODUCT_ID"
  | "CANONICAL_URL"
  | "AFFILIATE_URL"
  | "TITLE_BRAND"
  | null;

export type DuplicateResult = {
  status: DuplicateStatus;
  reason: DuplicateReason;
  matchedIndex: number | null;
};

function normalizeUrl(value?: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value.trim());
    url.hash = "";
    return (url.origin + url.pathname).replace(/\/$/, "").toLowerCase();
  } catch {
    return value.trim().replace(/\/$/, "").toLowerCase();
  }
}

function normalizeAffiliateUrl(value?: string | null) {
  return (value || "").trim().replace(/\/$/, "").toLowerCase();
}

function normalizeText(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function findDuplicate(
  candidate: ProductIdentity,
  existing: ProductIdentity[]
): DuplicateResult {
  const candidateId = (candidate.canonicalProductId || "").trim().toUpperCase();
  const candidateCanonical = normalizeUrl(candidate.canonicalUrl);
  const candidateAffiliate = normalizeAffiliateUrl(candidate.affiliateUrl);
  const candidateTitle = normalizeText(candidate.name);
  const candidateBrand = normalizeText(candidate.brand);

  for (let i = 0; i < existing.length; i++) {
    const item = existing[i];
    const itemId = (item.canonicalProductId || "").trim().toUpperCase();

    if (candidateId && itemId && candidateId === itemId) {
      return { status: "DUPLICATE", reason: "PRODUCT_ID", matchedIndex: i };
    }

    const itemCanonical = normalizeUrl(item.canonicalUrl);
    if (candidateCanonical && itemCanonical && candidateCanonical === itemCanonical) {
      return { status: "DUPLICATE", reason: "CANONICAL_URL", matchedIndex: i };
    }

    const itemAffiliate = normalizeAffiliateUrl(item.affiliateUrl);
    if (candidateAffiliate && itemAffiliate && candidateAffiliate === itemAffiliate) {
      return { status: "DUPLICATE", reason: "AFFILIATE_URL", matchedIndex: i };
    }
  }

  if (candidateTitle) {
    for (let i = 0; i < existing.length; i++) {
      const item = existing[i];
      const titleSame = candidateTitle === normalizeText(item.name);
      const brandSame =
        !candidateBrand ||
        !normalizeText(item.brand) ||
        candidateBrand === normalizeText(item.brand);

      if (titleSame && brandSame) {
        return {
          status: "POSSIBLE_DUPLICATE",
          reason: "TITLE_BRAND",
          matchedIndex: i
        };
      }
    }
  }

  return { status: "UNIQUE", reason: null, matchedIndex: null };
}

export function dedupeBatch<T extends ProductIdentity>(
  candidates: T[],
  existing: ProductIdentity[] = []
) {
  const accepted: T[] = [];
  const duplicates: Array<T & { duplicate: DuplicateResult }> = [];
  const possibleDuplicates: Array<T & { duplicate: DuplicateResult }> = [];

  for (const candidate of candidates) {
    const result = findDuplicate(candidate, [...existing, ...accepted]);

    if (result.status === "DUPLICATE") {
      duplicates.push({ ...candidate, duplicate: result });
      continue;
    }

    if (result.status === "POSSIBLE_DUPLICATE") {
      possibleDuplicates.push({ ...candidate, duplicate: result });
      continue;
    }

    accepted.push(candidate);
  }

  return { accepted, duplicates, possibleDuplicates };
}
