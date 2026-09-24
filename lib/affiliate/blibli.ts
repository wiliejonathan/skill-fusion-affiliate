export type ParsedBlibliAffiliateUrl = {
  originalUrl: string;
  canonicalUrl: string;
  productSlug: string | null;
  canonicalProductId: string | null;
  pickupPointCode: string | null;
  affiliateTrackingId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
};

export function parseBlibliAffiliateUrl(input:string):ParsedBlibliAffiliateUrl {
  const url=new URL(input);

  if(url.hostname!=="www.blibli.com" && url.hostname!=="blibli.com"){
    throw new Error("Unsupported host: expected Blibli product URL");
  }

  const marker="/is--";
  const markerIndex=url.pathname.indexOf(marker);

  let canonicalProductId:string|null=null;
  let productSlug:string|null=null;

  if(markerIndex>=0){
    productSlug=url.pathname.slice(0,markerIndex).split("/").filter(Boolean).pop() || null;
    const rawId=url.pathname.slice(markerIndex+marker.length).split("/")[0];
    canonicalProductId=rawId || null;
  }

  const canonicalUrl=new URL(url.origin+url.pathname);

  return {
    originalUrl:input,
    canonicalUrl:canonicalUrl.toString(),
    productSlug,
    canonicalProductId,
    pickupPointCode:url.searchParams.get("pickupPointCode"),
    affiliateTrackingId:url.searchParams.get("utm_medium"),
    utmSource:url.searchParams.get("utm_source"),
    utmMedium:url.searchParams.get("utm_medium"),
    utmCampaign:url.searchParams.get("utm_campaign"),
    utmContent:url.searchParams.get("utm_content")
  };
}

export function isLikelyBlibliAffiliateUrl(input:string){
  try{
    const parsed=parseBlibliAffiliateUrl(input);
    return parsed.utmSource==="affiliates" || (parsed.utmMedium || "").startsWith("aff_");
  }catch{
    return false;
  }
}
