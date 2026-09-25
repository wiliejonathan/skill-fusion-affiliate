export type ImportCandidate = {
  inputUrl: string;
  canonicalProductId: string | null;
  canonicalUrl: string | null;
  affiliateUrl: string;
  source: "blibli";
};

export function parseBlibliImportUrl(input:string):ImportCandidate {
  const raw=input.trim();
  const url=new URL(raw);

  if(url.hostname==="s.blibli.com"){
    return {
      inputUrl:raw,
      canonicalProductId:null,
      canonicalUrl:null,
      affiliateUrl:raw,
      source:"blibli"
    };
  }

  if(url.hostname!=="www.blibli.com" && url.hostname!=="blibli.com"){
    throw new Error("URL bukan Blibli");
  }

  const marker="/is--";
  const markerIndex=url.pathname.indexOf(marker);
  const canonicalProductId=markerIndex>=0
    ? url.pathname.slice(markerIndex+marker.length).split("/")[0] || null
    : null;

  const canonicalUrl=markerIndex>=0
    ? (url.origin+url.pathname).replace(/\/$/,"")
    : null;

  return {
    inputUrl:raw,
    canonicalProductId,
    canonicalUrl,
    affiliateUrl:raw,
    source:"blibli"
  };
}
