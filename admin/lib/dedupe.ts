import type {ImportCandidate} from "./importer";

export type CatalogIdentity = {
  canonicalProductId?: string | null;
  canonicalUrl?: string | null;
  affiliateUrl?: string | null;
};

export type ImportCheck = ImportCandidate & {
  status:"UNIQUE"|"DUPLICATE"|"NEEDS_RESOLVE"|"INVALID";
  reason:string;
};

const clean=(value?:string|null)=>(value||"").trim().replace(/\/$/,"").toLowerCase();

export function checkImports(
  candidates:Array<ImportCandidate|{invalidUrl:string}>,
  existing:CatalogIdentity[]
):ImportCheck[]{
  const seen=[...existing];

  return candidates.map(candidate=>{
    if("invalidUrl" in candidate){
      return {
        inputUrl:candidate.invalidUrl,
        canonicalProductId:null,
        canonicalUrl:null,
        affiliateUrl:candidate.invalidUrl,
        source:"blibli" as const,
        status:"INVALID" as const,
        reason:"URL tidak valid"
      };
    }

    const id=(candidate.canonicalProductId||"").toUpperCase();
    const duplicate=seen.find(item=>
      (id && (item.canonicalProductId||"").toUpperCase()===id) ||
      (candidate.canonicalUrl && clean(item.canonicalUrl)===clean(candidate.canonicalUrl)) ||
      clean(item.affiliateUrl)===clean(candidate.affiliateUrl)
    );

    if(duplicate){
      return {...candidate,status:"DUPLICATE",reason:id?"Product ID sudah ada":"Link produk sudah ada"};
    }

    seen.push(candidate);

    if(!candidate.canonicalProductId){
      return {...candidate,status:"NEEDS_RESOLVE",reason:"Shortlink perlu di-resolve sebelum cek Product ID"};
    }

    return {...candidate,status:"UNIQUE",reason:"Produk baru"};
  });
}
