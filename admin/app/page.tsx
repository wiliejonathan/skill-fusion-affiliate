"use client";

import {backendFetch as fetch,clearAdminKey,getStoredAdminKey,verifyAdminKey} from "@/lib/backend";
import {useEffect,useMemo,useState} from "react";
import {CheckCircle2,ClipboardPaste,CopyCheck,ExternalLink,Eye,EyeOff,LayoutDashboard,Link2,List,PackageSearch,RefreshCw,ShieldCheck,Trash2} from "lucide-react";
import {parseBlibliImportUrl,type ImportCandidate} from "@/lib/importer";
import {checkImports,type CatalogIdentity} from "@/lib/dedupe";

type ResolvedProduct={
  inputUrl:string; finalUrl:string; canonicalUrl:string|null; canonicalProductId:string|null;
  title:string|null; image:string|null; images:string[]; price:string|null; currency:string|null; description?:string|null; priceUpdatedAt?:string|null; pickupPointCode?:string|null; variants?:Array<{name:string;values:string[]}>; ok:boolean; message?:string;
};

type DbProduct={
  sequence:number;
  id:string;
  canonicalProductId:string;
  name:string;
  brand:string;
  category:string;
  images:string[];
  affiliateUrl:string;
  canonicalUrl:string|null;
  badge:string;
  features:string[];
  price:string|null;
  currency:string|null;
  description?:string|null;
  priceUpdatedAt?:string|null;
  pickupPointCode?:string|null;
  variants?:Array<{name:string;values:string[]}>;
};

const FIRST_LINK="https://s.blibli.com/GNtk/0qrtsw3f";
const FIRST_FINAL="https://www.blibli.com/p/acmic-braided-line-kabel-data-charger-100cm-fast-charging-cable-gc100-gl100-gm100/is--ACO-60021-00244-00014?pickupPointCode=PP-3538803&share_link=1&utm_campaign=affiliate_share&utm_content=salin_link&utm_medium=aff_6ab567e244d6d2a8c322863d&utm_source=affiliates";
const FIRST_CANONICAL="https://www.blibli.com/p/acmic-braided-line-kabel-data-charger-100cm-fast-charging-cable-gc100-gl100-gm100/is--ACO-60021-00244-00014";
const FIRST_TITLE="ACMIC Braided Line Kabel Data Charger 100cm Fast Charging Cable GC100 / GL100 / GM100";

const initialCatalog:CatalogIdentity[]=[{
  sequence:1,
  affiliateUrl:FIRST_LINK,
  canonicalProductId:"ACO-60021-00244-00014",
  canonicalUrl:FIRST_CANONICAL
}];

const STORAGE_CATALOG_KEY="skill-fusion:admin:catalog:v1";
const STORAGE_RESOLVED_KEY="skill-fusion:admin:resolved:v1";
const STORAGE_DIRTY_KEY="skill-fusion:admin:dirty:v1";

const initialResolved:Record<string,ResolvedProduct>={
  [FIRST_LINK]:{
    inputUrl:FIRST_LINK,finalUrl:FIRST_FINAL,canonicalUrl:FIRST_CANONICAL,
    canonicalProductId:"ACO-60021-00244-00014",title:FIRST_TITLE,
    image:"https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full45_njeqi5ul.jpg",
    images:[
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full45_njeqi5ul.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full15_ph0p14k5.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full16_mwsi08wd.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full17_fecq856n.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full18_gr5fkrpk.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full44_k26116c9.jpg"
    ],
    price:null,currency:null,ok:true
  }
};

function inferBrand(title:string,id:string){
  const upper=title.toUpperCase();
  if(upper.startsWith("XIAOMI")||id.startsWith("XIO-")) return "XIAOMI";
  if(upper.startsWith("ACMIC")||id.startsWith("ACO-")) return "ACMIC";
  return (title.split(/\s+/)[0]||"TECH").toUpperCase();
}

function formatAdminPrice(price:string|null|undefined,currency:string|null|undefined){
  const raw=String(price||"").trim();
  if(!raw) return null;
  const numeric=Number(raw.replace(/[^0-9]/g,""));
  if(!Number.isFinite(numeric)||numeric<=0) return null;
  if(String(currency||"IDR").toUpperCase()==="IDR"){
    return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(numeric);
  }
  return `${currency||""} ${new Intl.NumberFormat("id-ID").format(numeric)}`.trim();
}

function formatAdminPriceAge(value:string|null|undefined){
  if(!value) return "Belum pernah diperbarui";
  const time=Date.parse(value);
  if(!Number.isFinite(time)) return "Waktu update tidak diketahui";
  const diff=Math.max(0,Date.now()-time);
  const minutes=Math.floor(diff/60000);
  if(minutes<1) return "Baru saja diperbarui";
  if(minutes<60) return `Diperbarui ${minutes} menit lalu`;
  const hours=Math.floor(minutes/60);
  if(hours<24) return `Diperbarui ${hours} jam lalu`;
  return `Diperbarui ${Math.floor(hours/24)} hari lalu`;
}

function inferFeatures(title:string){
  const value=title.toLowerCase();
  const features:string[]=[];
  if(/100\s*cm/.test(value)) features.push("100 cm");
  if(/type\s*-?\s*c|usb\s*c/.test(value)) features.push("USB Type-C");
  if(/power delivery|\bpd\b/.test(value)) features.push("Power Delivery");
  else if(/fast\s*charging|6a/.test(value)) features.push("Fast charging");
  return features.length?features:["Blibli Affiliate"];
}

function buildDbProducts(catalog:CatalogIdentity[],resolved:Record<string,ResolvedProduct>):DbProduct[]{
  const products:DbProduct[]=[];
  catalog.forEach((item,index)=>{
    const affiliateUrl=item.affiliateUrl||"";
    const meta=resolved[affiliateUrl];
    const id=item.canonicalProductId||meta?.canonicalProductId||"";
    if(!affiliateUrl||!id) return;

    const name=(meta?.title||"Produk Blibli").trim();
    const images=meta?.images?.length?meta.images:(meta?.image?[meta.image]:[]);

    products.push({
      sequence:item.sequence||index+1,
      id,
      canonicalProductId:id,
      name,
      brand:inferBrand(name,id),
      category:"Charging & Cable",
      images,
      affiliateUrl,
      canonicalUrl:item.canonicalUrl||meta?.canonicalUrl||null,
      badge:"Blibli Affiliate",
      features:inferFeatures(name),
      price:meta?.price||null,
      currency:meta?.currency||null,
      description:meta?.description||null,
      priceUpdatedAt:meta?.priceUpdatedAt||null,
      pickupPointCode:meta?.pickupPointCode||null,
      variants:meta?.variants||[]
    });
  });
  return products;
}

function isUsableProductTitle(title:string|null|undefined){
  const value=String(title||"").trim();
  if(!value) return false;
  if(/online mall blibli|belanja online aman|blibli\.com/i.test(value)) return false;
  return value.length>5;
}

function sanitizeProductImages(images:string[]){
  const seen=new Set<string>();
  const out:string[]=[];
  for(const raw of images||[]){
    let url=String(raw||"").trim();
    if(!/^https:\/\//i.test(url)) continue;

    // Blibli heroThumbnails exposes /thumbnail/ URLs (often ?w=112).
    // Promote them to the original /full/ gallery image before rendering/syncing.
    url=url
      .replace("/images/catalog/thumbnail/","/images/catalog/full/")
      .replace("/images/catalog/square/","/images/catalog/full/");
    try{
      const parsed=new URL(url);
      ["w","h","width","height","quality","q","resize","format"].forEach(key=>parsed.searchParams.delete(key));
      url=parsed.toString();
    }catch{}

    const lower=url.toLowerCase();
    if(/\.(?:css|ico|svg)(?:[?#]|$)/i.test(lower)) continue;
    if(/(?:favicon|logo|icon|sprite|avatar|badge|tracking|pixel|placeholder)/i.test(lower)) continue;
    if(!/\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(lower)) continue;

    const key=lower.split("?")[0].replace(/\/+/g,"/");
    if(seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}

function sanitizeBlibliGallery(images:string[]){
  return sanitizeProductImages(images).filter(url=>
    /^https:\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\//i.test(url)
    ||/^https:\/\/(?:www\.)?acmic\.id\/cdn\/shop\/files\//i.test(url)
    ||/^https:\/\/cdn\.shopify\.com\/s\/files\//i.test(url)
    ||/^https:\/\/i02\.appmifile\.com\//i.test(url)
  );
}

const KNOWN_BLIBLI_GALLERIES:Record<string,string[]>={
  "XIO-60022-01141-00001":[
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full02_cc3scl4a.jpeg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full03_hrw4dzk1.jpeg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full04_rw5y2lhf.jpeg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full05_q6u0ao56.jpeg"
  ],
  "ACO-60021-00234-00001":[
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full01_nhva0kf2.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full01_gyux63fu.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full02_tax0h4ac.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full03_ulrs28kp.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full04_vs6zuqs1.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full05_qvrkqpgn.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full06_q4432wpc.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full07_ln9qkabt.jpg"
  ]
};

function dbToLocal(products:DbProduct[]){
  const catalog:CatalogIdentity[]=products.map(p=>({
    sequence:p.sequence,
    affiliateUrl:p.affiliateUrl,
    canonicalProductId:p.canonicalProductId,
    canonicalUrl:p.canonicalUrl||null
  }));
  const resolved:Record<string,ResolvedProduct>={};
  for(const p of products){
    resolved[p.affiliateUrl]={
      inputUrl:p.affiliateUrl,
      finalUrl:p.affiliateUrl,
      canonicalUrl:p.canonicalUrl||null,
      canonicalProductId:p.canonicalProductId,
      title:p.name,
      image:p.images?.[0]||null,
      images:p.images||[],
      price:p.price||null,
      currency:p.currency||null,
      description:p.description||null,
      priceUpdatedAt:p.priceUpdatedAt||null,
      pickupPointCode:p.pickupPointCode||null,
      variants:p.variants||[],
      ok:true
    };
  }
  return {catalog,resolved};
}

function validBlibliSource(...candidates:(string|null|undefined)[]){
  for(const candidate of candidates){
    const value=String(candidate||"").trim();
    if(/^https:\/\/(?:www\.|s\.)?blibli\.com(?:[/?#]|$)/i.test(value)) return value;
  }
  return "";
}

type ImportMode="single"|"multiple";
type ImportJobState={
  id:string;
  status:"queued"|"running"|"completed"|"error";
  total:number;
  done:number;
  imported:number;
  duplicates:number;
  failed:number;
  currentUrl?:string;
  messages?:string[];
  createdAt?:string;
  updatedAt?:string;
};

function extractHttpLinks(raw:string){
  const marked=String(raw||"").replace(/(?=https?:\/\/)/gi,"\n");
  const links:string[]=[];

  for(const line of marked.split(/\r?\n/)){
    const match=line.match(/https?:\/\/[^\s<>"']+/i);
    if(!match?.[0]) continue;

    const cleaned=match[0].replace(/[),.;]+$/,"").trim();
    if(cleaned&&!links.includes(cleaned)) links.push(cleaned);
  }

  return links;
}

function normalizeImportText(raw:string,mode:ImportMode){
  const links=extractHttpLinks(raw);
  if(mode==="single"){
    return links[0]||String(raw||"").replace(/[\r\n]+/g," ").trim();
  }
  return links.join("\n");
}

function productIdFromBlibliUrl(value:string){
  try{
    const u=new URL(value);
    const match=u.pathname.match(/\/is--([^/?#]+)/i);
    if(match?.[1]) return match[1];

    for(const key of ["defaultItemSku","itemSku","sku","itemId"]){
      const candidate=u.searchParams.get(key);
      if(candidate&&/^[A-Za-z0-9-]{3,100}$/.test(candidate)) return candidate;
    }
    return null;
  }catch{return null}
}

function canonicalBlibliUrl(value:string){
  try{
    const u=new URL(value);
    return (u.origin+u.pathname).replace(/\/$/,"");
  }catch{return value.split("?")[0].replace(/\/$/,"")}
}

function titleFromBlibliUrl(value:string){
  try{
    const u=new URL(value);
    const before=u.pathname.split("/is--")[0];
    const slug=before.split("/").filter(Boolean).pop()||"Produk Blibli";
    return slug
      .split("-")
      .filter(Boolean)
      .map((part,index)=>{
        if(/^\d/.test(part)||/^[a-z]+\d+$/i.test(part)) return part.toUpperCase();
        return index===0?part.toUpperCase():part;
      })
      .join(" ");
  }catch{return "Produk Blibli"}
}

async function resolveBlibliShortlinkFallback(inputUrl:string):Promise<ResolvedProduct|null>{
  function fromFinalUrl(finalUrl:string,titleHint?:string,imageHints:string[]=[]):ResolvedProduct|null{
    const canonicalProductId=productIdFromBlibliUrl(finalUrl);
    if(!canonicalProductId) return null;

    const canonicalUrl=canonicalBlibliUrl(finalUrl);
    const images=sanitizeProductImages(imageHints);
    const title=isUsableProductTitle(titleHint)
      ? String(titleHint).replace(/\s*[|\-]\s*Blibli.*$/i,"").trim()
      : titleFromBlibliUrl(canonicalUrl);

    return {
      ok:true,
      inputUrl,
      finalUrl,
      canonicalUrl,
      canonicalProductId,
      title,
      image:images[0]||null,
      images,
      price:null,
      currency:null
    };
  }

  // Fallback 1: RedirectCheck. CORS is explicitly open and the service follows
  // the full server-side redirect chain, so the browser can resolve s.blibli.com
  // without trying to read a cross-origin redirect itself.
  try{
    const response=await globalThis.fetch("https://www.redirectcheck.org/api/check",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        url:inputUrl,
        method:"GET",
        followMetaRefresh:true,
        maxHops:20,
        userAgent:"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36"
      })
    });
    if(response.ok){
      const payload=await response.json();
      const candidates=[
        payload?.final_result?.canonical,
        payload?.final_result?.final_url,
        ...(Array.isArray(payload?.redirects)?payload.redirects.flatMap((row:any)=>[row?.to,row?.canonical]):[])
      ].filter((value:unknown):value is string=>typeof value==="string");

      for(const value of candidates){
        if(/^https:\/\/(?:www\.)?blibli\.com(?:[/?#]|$)/i.test(value)){
          const resolved=fromFinalUrl(value);
          if(resolved) return resolved;
        }
      }
    }
  }catch{}

  // Fallback 2: Domainee's browser-safe redirect checker.
  try{
    const endpoint="https://api.domainee.dev/v1/tools/redirect-checker?url="+encodeURIComponent(inputUrl);
    const response=await globalThis.fetch(endpoint,{cache:"no-store"});
    if(response.ok){
      const payload=await response.json();
      const candidates=[
        payload?.data?.finalUrl,
        ...(Array.isArray(payload?.data?.hops)?payload.data.hops.map((row:any)=>row?.url):[])
      ].filter((value:unknown):value is string=>typeof value==="string");

      for(const value of candidates.reverse()){
        if(/^https:\/\/(?:www\.)?blibli\.com(?:[/?#]|$)/i.test(value)){
          const resolved=fromFinalUrl(value);
          if(resolved) return resolved;
        }
      }
    }
  }catch{}

  // Fallback 3: metadata resolver.
  try{
    const endpoint="https://api.microlink.io/?url="+encodeURIComponent(inputUrl);
    const response=await globalThis.fetch(endpoint,{cache:"no-store"});
    if(response.ok){
      const payload=await response.json();
      const data=payload?.data||{};
      const candidates=[
        data?.url,
        data?.publisher?.url,
        data?.author?.url
      ].filter((value:unknown):value is string=>typeof value==="string");

      const serialized=JSON.stringify(data).replace(/\\u002F/ig,"/");
      const embedded=serialized.match(/https:\/\/(?:www\.)?blibli\.com\/p\/[^"\\\s<>]+\/is--[A-Za-z0-9-]+/i);
      if(embedded?.[0]) candidates.unshift(embedded[0]);

      const imageHints=[
        data?.image?.url,
        data?.image,
        data?.logo?.url
      ].filter((value:unknown):value is string=>typeof value==="string");

      for(const value of candidates){
        if(/^https:\/\/(?:www\.)?blibli\.com(?:[/?#]|$)/i.test(value)){
          const resolved=fromFinalUrl(value,data?.title,imageHints);
          if(resolved) return resolved;
        }
      }
    }
  }catch{}

  // Fallback 4: reader proxy.
  try{
    const endpoint="https://r.jina.ai/"+inputUrl;
    const response=await globalThis.fetch(endpoint,{cache:"no-store"});
    if(response.ok){
      const body=await response.text();
      const match=body.match(/https:\/\/(?:www\.)?blibli\.com\/p\/[^\s<>"')]+\/is--[A-Za-z0-9-]+/i);
      if(match?.[0]){
        const resolved=fromFinalUrl(match[0]);
        if(resolved) return resolved;
      }
    }
  }catch{}

  return null;
}


async function enrichResolvedImages(data:ResolvedProduct,inputUrl:string):Promise<ResolvedProduct>{
  const existing=sanitizeProductImages(
    data.images?.length?data.images:(data.image?[data.image]:[])
  );
  if(existing.length){
    return {...data,image:existing[0]||null,images:existing};
  }

  const targets=Array.from(new Set([
    data.canonicalUrl,
    data.finalUrl,
    inputUrl
  ].filter((value):value is string=>typeof value==="string"&&/^https:\/\//i.test(value))));

  const collected:string[]=[];
  const add=(values:unknown[])=>{
    for(const raw of values){
      if(typeof raw!=="string") continue;
      collected.push(raw.replace(/\\u002F/ig,"/").replace(/\\\//g,"/"));
    }
  };

  // Metadata API often exposes the product's og:image even when the full
  // commerce DOM is protected by Blibli's anti-bot layer.
  for(const target of targets){
    try{
      const endpoint="https://api.microlink.io/?url="+encodeURIComponent(target);
      const response=await globalThis.fetch(endpoint,{cache:"no-store"});
      if(!response.ok) continue;
      const payload=await response.json();
      const meta=payload?.data||{};
      add([
        meta?.image?.url,
        typeof meta?.image==="string"?meta.image:null
      ]);
      const serialized=JSON.stringify(meta).replace(/\\u002F/ig,"/").replace(/\\\//g,"/");
      add(serialized.match(/https:\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\/[^"'\\s<>]+/ig)||[]);
      const images=sanitizeProductImages(collected);
      if(images.length){
        const title=isUsableProductTitle(meta?.title)?String(meta.title).replace(/\s*[|\-]\s*Blibli.*$/i,"").trim():data.title;
        return {...data,title,image:images[0],images};
      }
    }catch{}
  }

  // Reader fallback: collect any Blibli catalog images embedded in markdown/text.
  for(const target of targets){
    try{
      const response=await globalThis.fetch("https://r.jina.ai/"+target,{cache:"no-store"});
      if(!response.ok) continue;
      const body=await response.text();
      add(body.match(/https:\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\/[^"'\\s<>\])]+/ig)||[]);
      add(Array.from(body.matchAll(/!\[[^\]]*\]\((https:\/\/[^)]+)\)/g),match=>match[1]));
      const images=sanitizeProductImages(collected);
      if(images.length) return {...data,image:images[0],images};
    }catch{}
  }

  return {...data,image:null,images:[]};
}

export default function AdminPage(){
  const [text,setText]=useState("");
  const [importMode,setImportMode]=useState<ImportMode>("single");
  const [authReady,setAuthReady]=useState(false);
  const [authenticated,setAuthenticated]=useState(false);
  const [loginPassword,setLoginPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [rememberLogin,setRememberLogin]=useState(true);
  const [loginBusy,setLoginBusy]=useState(false);
  const [loginError,setLoginError]=useState("");
  const [catalog,setCatalog]=useState<CatalogIdentity[]>(initialCatalog);
  const [resolved,setResolved]=useState<Record<string,ResolvedProduct>>(initialResolved);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [hydrated,setHydrated]=useState(false);
  const [serverReady,setServerReady]=useState(false);
  const [refreshingUrl,setRefreshingUrl]=useState<string|null>(null);
  const [reloadingUrl,setReloadingUrl]=useState<string|null>(null);
  const [bulkAction,setBulkAction]=useState<null|"refresh"|"reload"|"repair">(null);
  const [dirtyUrls,setDirtyUrls]=useState<string[]>([]);
  const [productNotice,setProductNotice]=useState<Record<string,string>>({});
  const [duplicatePopup,setDuplicatePopup]=useState<{title:string;items:string[]}|null>(null);
  const [importJob,setImportJob]=useState<ImportJobState|null>(null);

  async function applyServerProducts(products:DbProduct[]){
    const server=dbToLocal(products);
    setCatalog(server.catalog);
    setResolved(server.resolved);
    setDirtyUrls([]);
    setServerReady(true);
  }

  async function loginAdmin(password=loginPassword,remember=rememberLogin){
    if(!password.trim()){
      setLoginError("Masukkan password Admin.");
      return;
    }
    setLoginBusy(true);
    setLoginError("");
    try{
      const health=await fetch("/api/health-check",{cache:"no-store"} as RequestInit).then(res=>res.json());
      if(!health?.ok) throw new Error(health?.message||"Apps Script tidak dapat dijangkau.");
      const data=await verifyAdminKey(password,remember);
      if(!data?.ok||!Array.isArray(data.products)) throw new Error(data?.message||"Password Admin salah.");
      await applyServerProducts(data.products as DbProduct[]);
      setAuthenticated(true);
      setLoginPassword("");
    }catch(error){
      setAuthenticated(false);
      setLoginError(error instanceof Error?error.message:"Password Admin salah.");
    }finally{
      setLoginBusy(false);
      setAuthReady(true);
    }
  }

  function logoutAdmin(){
    clearAdminKey();
    setAuthenticated(false);
    setServerReady(false);
    setLoginPassword("");
    setLoginError("");
  }

  async function pushDatabase(nextCatalog:CatalogIdentity[],nextResolved:Record<string,ResolvedProduct>){
    const products=buildDbProducts(nextCatalog,nextResolved);
    if(!products.length) return null;
    const res=await fetch("/api/catalog",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({products})
    });
    const data=await res.json();
    if(data?.ok&&Array.isArray(data.products)){
      setServerReady(true);
      return data.products as DbProduct[];
    }
    return null;
  }

  async function pullDatabase(){
    const res=await fetch("/api/catalog",{cache:"no-store"});
    const data=await res.json();
    if(data?.ok&&Array.isArray(data.products)){
      const local=dbToLocal(data.products as DbProduct[]);
      setCatalog(local.catalog);
      setResolved(local.resolved);
      setServerReady(true);
      return data.products as DbProduct[];
    }
    return null;
  }

  useEffect(()=>{
    let loadedCatalog=initialCatalog;
    let loadedResolved=initialResolved;
    let loadedDirty:string[]=[];

    try{
      const savedCatalog=window.localStorage.getItem(STORAGE_CATALOG_KEY);
      const savedResolved=window.localStorage.getItem(STORAGE_RESOLVED_KEY);
      const savedDirty=window.localStorage.getItem(STORAGE_DIRTY_KEY);

      if(savedCatalog){
        const parsed=JSON.parse(savedCatalog);
        if(Array.isArray(parsed)&&parsed.length){
          loadedCatalog=parsed.map((item:CatalogIdentity,index:number)=>({
            ...item,
            sequence:typeof item?.sequence==="number"?item.sequence:index+1
          }));
        }
      }
      if(savedResolved){
        const parsed=JSON.parse(savedResolved);
        if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed)) loadedResolved=parsed;
      }
      if(savedDirty){
        const parsed=JSON.parse(savedDirty);
        if(Array.isArray(parsed)) loadedDirty=parsed.filter((value:unknown):value is string=>typeof value==="string");
      }
    }catch{
      // Cached catalog is only a visual fallback. Server Draft remains authoritative.
    }

    setCatalog(loadedCatalog);
    setResolved(loadedResolved);
    setDirtyUrls(loadedDirty);
    setHydrated(true);

    const stored=getStoredAdminKey();
    if(!stored){
      setAuthReady(true);
      return;
    }

    (async()=>{
      try{
        const data=await verifyAdminKey(stored,Boolean(window.localStorage.getItem("skillfusion:adminKey")));
        if(!data?.ok||!Array.isArray(data.products)) throw new Error("Sesi Admin tidak valid.");
        await applyServerProducts(data.products as DbProduct[]);
        setAuthenticated(true);
      }catch{
        clearAdminKey();
        setAuthenticated(false);
      }finally{
        setAuthReady(true);
      }
    })();
  },[]);

  useEffect(()=>{
    if(!hydrated) return;
    window.localStorage.setItem(STORAGE_CATALOG_KEY,JSON.stringify(catalog));
    window.localStorage.setItem(STORAGE_RESOLVED_KEY,JSON.stringify(resolved));
    window.localStorage.setItem(STORAGE_DIRTY_KEY,JSON.stringify(dirtyUrls));
  },[catalog,resolved,dirtyUrls,hydrated]);

  useEffect(()=>{
    if(!authenticated) return;

    let stopped=false;
    let pending=false;

    async function syncVisitorPrices(){
      if(stopped||pending||document.visibilityState==="hidden") return;
      if(busy||refreshingUrl||reloadingUrl||bulkAction||dirtyUrls.length) return;
      pending=true;
      try{
        await pullDatabase();
      }catch{
        // Visitors can update prices independently; keep current Admin view if polling fails.
      }finally{
        pending=false;
      }
    }

    const timer=window.setInterval(syncVisitorPrices,15000);
    const onVisible=()=>{if(document.visibilityState==="visible") void syncVisitorPrices()};
    document.addEventListener("visibilitychange",onVisible);

    return ()=>{
      stopped=true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange",onVisible);
    };
  },[authenticated,busy,refreshingUrl,reloadingUrl,bulkAction,dirtyUrls.length]);

  useEffect(()=>{
    if(!authenticated) return;

    let stopped=false;
    let pending=false;
    let finishedId="";

    async function pollImportJob(){
      if(stopped||pending) return;
      pending=true;
      try{
        const res=await fetch("/api/import-job",{cache:"no-store"});
        const data=await res.json();
        const job=(data?.job||null) as ImportJobState|null;
        if(stopped) return;

        setImportJob(job);

        if(job&&(job.status==="queued"||job.status==="running")){
          setBusy(true);
          setNotice(
            `Background import ${job.done}/${job.total} · ${job.imported} berhasil · `+
            `${job.duplicates} duplicate · ${job.failed} gagal`+
            (job.currentUrl?` · ${job.currentUrl}`:"")
          );

          // While Admin is open, don't wait for the approximate Apps Script
          // clock trigger. Kick up to two queued products immediately.
          if(document.visibilityState!=="hidden"){
            try{
              const kickRes=await fetch("/api/import-kick",{method:"POST"});
              const kickData=await kickRes.json();
              const kicked=(kickData?.job||null) as ImportJobState|null;
              if(kicked&&!stopped){
                setImportJob(kicked);
                if(kicked.status==="completed"||kicked.status==="error"){
                  setBusy(false);
                  await pullDatabase();
                  setNotice(
                    kicked.status==="completed"
                      ? `✓ Import selesai · ${kicked.imported} produk masuk Client · ${kicked.duplicates} duplicate dilewati · ${kicked.failed} gagal.`
                      : `Import background berhenti dengan error · ${kicked.imported} berhasil · ${kicked.failed} gagal.`
                  );
                }
              }
            }catch{
              // Scheduled trigger will continue the same persisted job.
            }
          }
          return;
        }

        if(job&&(job.status==="completed"||job.status==="error")){
          setBusy(false);
          if(finishedId!==job.id){
            finishedId=job.id;
            await pullDatabase();
            setNotice(
              job.status==="completed"
                ? `✓ Import selesai · ${job.imported} produk masuk Client · ${job.duplicates} duplicate dilewati · ${job.failed} gagal.`
                : `Import background berhenti dengan error · ${job.imported} berhasil · ${job.failed} gagal.`
            );
          }
        }else{
          setBusy(false);
        }
      }catch{
        // Keep the current screen; the server-side job continues independently.
      }finally{
        pending=false;
      }
    }

    void pollImportJob();
    const timer=window.setInterval(pollImportJob,3000);
    const onVisible=()=>{if(document.visibilityState==="visible")void pollImportJob()};
    document.addEventListener("visibilitychange",onVisible);

    return ()=>{
      stopped=true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange",onVisible);
    };
  },[authenticated]);

  function switchImportMode(mode:ImportMode){
    setImportMode(mode);
    setText(current=>normalizeImportText(current,mode));
    setNotice("");
  }

  function handleImportTextChange(value:string){
    if(importMode==="single"){
      const links=extractHttpLinks(value);
      if(links.length){
        setText(links[0]);
        return;
      }
      setText(value.replace(/[\r\n]+/g," "));
      return;
    }
    setText(value);
  }

  function appendMultipleLinks(current:string,pasted:string){
    const incoming=normalizeImportText(pasted,"multiple").trim();
    if(!incoming) return current;
    const existing=String(current||"").replace(/[\s\n]+$/,"");
    return existing.trim()?existing+"\n"+incoming:incoming;
  }

  function handleImportPaste(event:React.ClipboardEvent<HTMLTextAreaElement>){
    const pasted=event.clipboardData.getData("text");
    if(!pasted) return;
    event.preventDefault();

    if(importMode==="multiple"){
      setText(current=>appendMultipleLinks(current,pasted));
    }else{
      setText(normalizeImportText(pasted,"single"));
    }
    setNotice("");
  }

  async function pasteImportLinks(){
    try{
      const pasted=await navigator.clipboard.readText();
      if(!pasted.trim()){
        setNotice("Clipboard kosong.");
        return;
      }

      if(importMode==="multiple"){
        const incoming=normalizeImportText(pasted,"multiple").trim();
        if(!incoming){
          setNotice("Clipboard tidak berisi link http/https yang valid.");
          return;
        }
        setText(current=>appendMultipleLinks(current,pasted));
      }else{
        setText(normalizeImportText(pasted,"single"));
      }
      setNotice("");
    }catch{
      setNotice("Clipboard tidak dapat dibaca. Izinkan akses clipboard di browser lalu coba lagi.");
    }
  }

  const detectedLinkCount=useMemo(()=>extractHttpLinks(text).length,[text]);

  const checks=useMemo(()=>{
    const detected=extractHttpLinks(text);
    const lines=importMode==="single"?detected.slice(0,1):detected;
    const candidates:Array<ImportCandidate|{invalidUrl:string}>=lines.map(line=>{
      try{return parseBlibliImportUrl(line)}catch{return {invalidUrl:line}}
    });
    return checkImports(candidates,catalog);
  },[text,catalog,importMode]);

  const counts=checks.reduce((acc,row)=>{acc[row.status]=(acc[row.status]||0)+1;return acc},{} as Record<string,number>);

  async function analyzeLinks(){
    const ready=checks.filter(x=>x.status==="READY");
    const preflightDuplicates=checks.filter(x=>x.status==="DUPLICATE");

    if(!ready.length){
      if(preflightDuplicates.length){
        setDuplicatePopup({
          title:preflightDuplicates.length>1?"Link duplicate ditemukan":"Link duplicate ditemukan",
          items:preflightDuplicates.map(row=>`${row.inputUrl} — ${row.reason}`)
        });
        setNotice("Tidak ada link baru. Duplicate hanya dilewati dan tidak mengganggu link lainnya.");
      }else{
        setNotice("Tidak ada link baru yang valid.");
      }
      return;
    }

    setBusy(true);
    setNotice(`Menyiapkan background import · ${ready.length} link...`);

    try{
      const res=await fetch("/api/import-job",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({links:ready.map(row=>row.inputUrl)})
      });
      const data=await res.json();
      const job=data?.job as ImportJobState|undefined;
      if(!res.ok||!data?.ok||!job) throw new Error(data?.message||"Background import gagal dimulai.");

      setImportJob(job);
      setText("");

      // Start the first worker batch immediately. The Apps Script trigger remains
      // scheduled as a fallback if this tab closes during or after the request.
      void fetch("/api/import-kick",{method:"POST"}).catch(()=>{});

      if(preflightDuplicates.length){
        setDuplicatePopup({
          title:preflightDuplicates.length>1?"Beberapa duplicate dilewati":"Link duplicate dilewati",
          items:preflightDuplicates.map(row=>`${row.inputUrl} — ${row.reason}`)
        });
      }

      setNotice(
        `✓ Background import dimulai · ${job.total} link masuk antrean. `+
        "Proses langsung dimulai. Tab Admin boleh ditutup; sisa antrean tetap berjalan di Apps Script."
      );
    }catch(error){
      setBusy(false);
      setNotice("Import gagal dimulai: "+(error instanceof Error?error.message:"coba lagi"));
    }
  }

  async function pushSingleProduct(url:string,nextCatalog:CatalogIdentity[]=catalog,nextResolved:Record<string,ResolvedProduct>=resolved){
    const product=buildDbProducts(nextCatalog,nextResolved).find(row=>row.affiliateUrl===url);
    if(!product) throw new Error("Data produk Admin belum lengkap");

    const res=await fetch("/api/catalog",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({product})
    });
    const data=await res.json();
    if(!res.ok||!data?.ok||!Array.isArray(data.products)){
      throw new Error(data?.message||"Database sync gagal");
    }
    setServerReady(true);
    return data.products as DbProduct[];
  }

  function mergeReloadedProduct(
    url:string,
    data:ResolvedProduct,
    baseCatalog:CatalogIdentity[],
    baseResolved:Record<string,ResolvedProduct>
  ){
    const item=baseCatalog.find(x=>x.affiliateUrl===url);
    const previous=baseResolved[url];

    const previousImages=sanitizeProductImages(
      previous?.images?.length ? previous.images : (previous?.image?[previous.image]:[])
    );
    const domImages=sanitizeProductImages(
      data.images?.length ? data.images : (data.image?[data.image]:[])
    );
    const productId=data.canonicalProductId||previous?.canonicalProductId||item?.canonicalProductId||null;
    const knownImages=productId ? (KNOWN_BLIBLI_GALLERIES[productId]||[]) : [];

    // Some still-deployed Apps Script versions return only a sparse fallback
    // gallery. For exact known SKUs, never let that shrink the correct Blibli
    // heroThumbnails gallery.
    const nextImages=
      knownImages.length>domImages.length
        ? knownImages
        : (domImages.length?domImages:previousImages);

    const merged:ResolvedProduct={
      ...previous,
      ...data,
      inputUrl:url,
      title:isUsableProductTitle(data.title)?data.title:(previous?.title||"Produk Blibli"),
      canonicalUrl:data.canonicalUrl||previous?.canonicalUrl||item?.canonicalUrl||null,
      canonicalProductId:productId,
      image:nextImages[0]||data.image||previous?.image||null,
      images:nextImages
    };

    return {
      resolved:{...baseResolved,[url]:merged},
      catalog:baseCatalog.map(row=>
        row.affiliateUrl===url
          ? {
              ...row,
              canonicalProductId:merged.canonicalProductId||row.canonicalProductId,
              canonicalUrl:merged.canonicalUrl||row.canonicalUrl
            }
          : row
      ),
      merged
    };
  }

  async function refreshProduct(url:string){
    if(refreshingUrl||reloadingUrl||bulkAction) return;

    setRefreshingUrl(url);
    setProductNotice(prev=>({...prev,[url]:"Mengirim ulang data Admin ke Client..."}));

    try{
      await pushSingleProduct(url);

      // Do not replace the whole Admin workspace with the database response.
      // Other products may have Reload DOM changes that have not been synced yet.
      const refreshed=resolved[url];
      setDirtyUrls(prev=>prev.filter(item=>item!==url));
      setProductNotice(prev=>({
        ...prev,
        [url]:refreshed?.images?.length
          ? `✓ Refresh Data selesai · ${refreshed.images.length} foto · Admin → Client`
          : "✓ Refresh Data selesai · Admin → Client"
      }));
    }catch(error){
      setProductNotice(prev=>({
        ...prev,
        [url]:"Refresh gagal: "+(error instanceof Error?error.message:"coba lagi")
      }));
    }finally{
      setRefreshingUrl(null);
    }
  }

  async function reloadDomProduct(url:string){
    if(refreshingUrl||reloadingUrl||bulkAction) return;

    const item=catalog.find(x=>x.affiliateUrl===url);
    const previous=resolved[url];
    const source=validBlibliSource(item?.canonicalUrl,previous?.canonicalUrl,url,item?.affiliateUrl);
    if(!source){
      setProductNotice(prev=>({...prev,[url]:"Reload DOM gagal: URL Blibli produk tidak tersedia. Gunakan link affiliate/canonical Blibli yang valid."}));
      return;
    }

    setReloadingUrl(url);
    setProductNotice(prev=>({...prev,[url]:"Reload DOM Blibli sedang berjalan..."}));

    try{
      const res=await fetch(
        "/api/reload-dom?url="+encodeURIComponent(source)+"&ts="+Date.now(),
        {cache:"no-store"}
      );
      let data:ResolvedProduct=await res.json();

      if(!res.ok||!data?.ok){
        throw new Error(data?.message||"Reload DOM gagal");
      }

      data=await enrichResolvedImages(data,url);
      const next=mergeReloadedProduct(url,data,catalog,resolved);
      if(!next.merged.images?.length){
        throw new Error("Image produk belum berhasil ditemukan.");
      }
      setCatalog(next.catalog);
      setResolved(next.resolved);

      // Immediately publish the sanitized gallery so Client and Admin cannot drift.
      await pushSingleProduct(url,next.catalog,next.resolved);
      setDirtyUrls(prev=>prev.filter(item=>item!==url));

      setProductNotice(prev=>({
        ...prev,
        [url]:`✓ Reload DOM selesai · ${data.images?.length||0} sumber terbaca · ${next.merged.images?.length||0} foto produk valid · langsung tersinkron ke Client`
      }));
    }catch(error){
      setProductNotice(prev=>({
        ...prev,
        [url]:"Reload DOM gagal: "+(error instanceof Error?error.message:"coba lagi")
      }));
    }finally{
      setReloadingUrl(null);
    }
  }

  async function refreshDataAll(){
    if(bulkAction||refreshingUrl||reloadingUrl) return;

    setBulkAction("refresh");
    setNotice("Refresh Data All · mengirim seluruh data Admin ke Client...");

    try{
      const synced=await pushDatabase(catalog,resolved);
      if(!synced) throw new Error("Database sync gagal");

      const local=dbToLocal(synced);
      setCatalog(local.catalog);
      setResolved(local.resolved);
      setDirtyUrls([]);
      setNotice(`✓ Refresh Data All selesai · ${synced.length} produk Admin sudah dikirim ke Client.`);
    }catch(error){
      setNotice("Refresh Data All gagal: "+(error instanceof Error?error.message:"coba lagi"));
    }finally{
      setBulkAction(null);
    }
  }

  async function repairMissingImages(){
    if(bulkAction||refreshingUrl||reloadingUrl) return;

    const missingCount=buildDbProducts(catalog,resolved).filter(product=>!product.images?.length).length;
    if(!missingCount){
      setNotice("✓ Semua produk sudah memiliki image.");
      return;
    }

    setBulkAction("repair");
    setNotice(`Repair Missing Images · mencari image untuk ${missingCount} produk tanpa foto...`);

    try{
      const res=await fetch("/api/repair-images",{method:"POST"});
      const data=await res.json();
      if(!res.ok||!data?.ok||!Array.isArray(data.products)){
        throw new Error(data?.message||"Repair image gagal");
      }

      const local=dbToLocal(data.products as DbProduct[]);
      setCatalog(local.catalog);
      setResolved(local.resolved);
      setDirtyUrls([]);
      setServerReady(true);

      const repaired=Number(data.repaired||0);
      const remaining=Number(data.remaining||0);
      setNotice(
        remaining
          ? `Repair Missing Images selesai · ${repaired} produk berhasil mendapat image, ${remaining} masih belum ditemukan.`
          : `✓ Repair Missing Images selesai · ${repaired} produk berhasil mendapat image dan langsung tersinkron ke Client.`
      );
    }catch(error){
      setNotice("Repair Missing Images gagal: "+(error instanceof Error?error.message:"coba lagi"));
    }finally{
      setBulkAction(null);
    }
  }

  async function reloadAll(){
    if(bulkAction||refreshingUrl||reloadingUrl) return;

    setBulkAction("reload");
    let nextCatalog=[...catalog];
    let nextResolved={...resolved};
    const reloadedUrls:string[]=[];
    let success=0;
    let failed=0;

    try{
      for(let index=0;index<catalog.length;index++){
        const item=catalog[index];
        const url=item.affiliateUrl||"";
        if(!url) continue;

        const previous=nextResolved[url];
        const source=validBlibliSource(item.canonicalUrl,previous?.canonicalUrl,url,item.affiliateUrl);
        if(!source){
          failed++;
          setProductNotice(prev=>({...prev,[url]:"Reload DOM gagal: URL Blibli produk tidak tersedia."}));
          continue;
        }
        setNotice(`Reload All · membaca DOM Blibli ${index+1}/${catalog.length}...`);

        try{
          const res=await fetch(
            "/api/reload-dom?url="+encodeURIComponent(source)+"&ts="+Date.now()+"-"+index,
            {cache:"no-store"}
          );
          let data:ResolvedProduct=await res.json();
          if(!res.ok||!data?.ok) throw new Error(data?.message||"Reload DOM gagal");

          data=await enrichResolvedImages(data,url);
          const next=mergeReloadedProduct(url,data,nextCatalog,nextResolved);
          if(!next.merged.images?.length) throw new Error("Image produk belum berhasil ditemukan.");
          nextCatalog=next.catalog;
          nextResolved=next.resolved;
          reloadedUrls.push(url);
          success++;

          setProductNotice(prev=>({
            ...prev,
            [url]:`✓ Reload DOM · ${data.images?.length||0} dibaca · ${next.merged.images?.length||0} foto di Admin`
          }));
        }catch(error){
          failed++;
          setProductNotice(prev=>({
            ...prev,
            [url]:"Reload DOM gagal: "+(error instanceof Error?error.message:"coba lagi")
          }));
        }
      }

      setCatalog(nextCatalog);
      setResolved(nextResolved);

      if(success){
        const synced=await pushDatabase(nextCatalog,nextResolved);
        if(!synced) throw new Error("Sinkron Client setelah Reload All gagal");
      }
      setDirtyUrls([]);

      setNotice(
        failed
          ? `Reload All selesai · ${success} berhasil dan langsung tersinkron ke Client, ${failed} gagal.`
          : `✓ Reload All selesai · ${success} produk dibaca ulang, dibersihkan, dan langsung tersinkron ke Client.`
      );
    }finally{
      setBulkAction(null);
    }
  }

  async function removeLink(url:string){
    const item=catalog.find(x=>x.affiliateUrl===url);
    const id=item?.canonicalProductId||resolved[url]?.canonicalProductId;


    try{
      if(id){
        await fetch("/api/catalog?id="+encodeURIComponent(id),{method:"DELETE"});
      }
    setCatalog(prev=>prev.filter(x=>x.affiliateUrl!==url));
    setResolved(prev=>{const n={...prev};delete n[url];return n});
    setDirtyUrls(prev=>prev.filter(item=>item!==url));

      setNotice("Produk dihapus dan langsung disinkronkan ke Client.");
    }catch{
      setNotice("Penghapusan gagal. Produk tetap dipertahankan; coba lagi.");
    }
  }

  if(!authReady){
    return <main className="admin-login-page"><div className="admin-login-card admin-login-loading"><div className="mark">SF</div><p>Memeriksa sesi Admin...</p></div></main>;
  }

  if(!authenticated){
    return <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <div className="mark">SF</div>
          <div><strong>Skill Fusion</strong><small>ADMIN ACCESS</small></div>
        </div>
        <span className="eyebrow">SECURE ADMIN</span>
        <h1>Masuk ke Admin</h1>
        <p className="admin-login-copy">Masukkan password Admin untuk mengelola katalog Skill Fusion.</p>
        <form onSubmit={e=>{e.preventDefault();void loginAdmin();}}>
          <label className="admin-login-label" htmlFor="admin-password">Password Admin</label>
          <div className="admin-password-wrap">
            <input
              id="admin-password"
              type={showPassword?"text":"password"}
              autoComplete="current-password"
              value={loginPassword}
              onChange={e=>setLoginPassword(e.target.value)}
              placeholder="Masukkan password"
              disabled={loginBusy}
              autoFocus
            />
            <button
              type="button"
              className="admin-password-toggle"
              onClick={()=>setShowPassword(value=>!value)}
              aria-label={showPassword?"Sembunyikan password":"Lihat password"}
              title={showPassword?"Sembunyikan password":"Lihat password"}
              disabled={loginBusy}
            >
              {showPassword?<EyeOff size={19}/>:<Eye size={19}/>}
            </button>
          </div>
          <label className="admin-remember">
            <input type="checkbox" checked={rememberLogin} onChange={e=>setRememberLogin(e.target.checked)} disabled={loginBusy}/>
            <span><strong>Remember me</strong><small>Simpan login di perangkat ini sampai Anda logout.</small></span>
          </label>
          {loginError&&<div className="admin-login-error">{loginError}</div>}
          <button className="admin-login-button" type="submit" disabled={loginBusy||!loginPassword.trim()}>
            {loginBusy?"Memeriksa...":"Masuk ke Admin"}
          </button>
        </form>
        <div className="admin-login-security"><ShieldCheck size={17}/><span>Password diverifikasi langsung ke backend Apps Script.</span></div>
      </section>
    </main>;
  }

  return <main className="shell">
    {duplicatePopup&&<div className="duplicate-modal-backdrop" role="presentation" onClick={()=>setDuplicatePopup(null)}>
      <section className="duplicate-modal" role="dialog" aria-modal="true" aria-labelledby="duplicate-modal-title" onClick={e=>e.stopPropagation()}>
        <div className="duplicate-modal-icon">!</div>
        <h2 id="duplicate-modal-title">{duplicatePopup.title}</h2>
        <p>Link ini tidak di-import ulang karena mengarah ke produk yang sudah ada di katalog.</p>
        <div className="duplicate-modal-items">
          {duplicatePopup.items.map((item,index)=><div className="duplicate-modal-item" key={index}>{item}</div>)}
        </div>
        <button type="button" onClick={()=>setDuplicatePopup(null)}>OK, Mengerti</button>
      </section>
    </div>}
    <aside>
      <div className="brand"><div className="mark">SF</div><div><strong>Skill Fusion</strong><small>ADMIN</small></div></div>
      <nav>
        <a className="active" href="#dashboard"><LayoutDashboard size={18}/>Dashboard</a>
        <a href="#import"><Link2 size={18}/>Import Affiliate</a>
        <a href="#products"><PackageSearch size={18}/>Products</a>
      </nav>
      <div className="secure"><ShieldCheck size={18}/><span>Admin dan Client memakai katalog database yang sama.</span></div>
    </aside>

    <section className="content">
      <header id="dashboard">
        <div><span className="eyebrow">CATALOG CONTROL CENTER</span><h1>Skill Fusion Admin</h1><p>Kelola hanya data katalog yang stabil: identitas produk, foto, kategori, fitur, dan link affiliate.</p></div>
        <div className="header-controls">
          <div className="dashboard-actions">
            <button
              className="dashboard-action refresh-all"
              onClick={refreshDataAll}
              disabled={bulkAction!==null||refreshingUrl!==null||reloadingUrl!==null||busy}
            >
              <RefreshCw size={16}/>
              {bulkAction==="refresh"?"Refreshing All...":"Refresh Data All"}
            </button>
            <button
              className="dashboard-action repair-images"
              onClick={repairMissingImages}
              disabled={bulkAction!==null||refreshingUrl!==null||reloadingUrl!==null||busy}
            >
              <PackageSearch size={16}/>
              {bulkAction==="repair"?"Repairing Images...":"Repair Missing Images"}
            </button>
            <button
              className="dashboard-action reload-all"
              onClick={reloadAll}
              disabled={bulkAction!==null||refreshingUrl!==null||reloadingUrl!==null||busy}
            >
              <PackageSearch size={16}/>
              {bulkAction==="reload"?"Reloading All...":"Reload All"}
            </button>
          </div>
          <button className="admin-logout" onClick={logoutAdmin}>Logout</button>
          <div className="pill">STABLE CATALOG</div>
        </div>
      </header>

      <div className="stats">
        <article><span>Produk tersimpan</span><strong>{catalog.length}</strong><small>produk katalog</small></article>
        <article><span>Link baru</span><strong>{counts.READY||0}</strong><small>siap di-import</small></article>
        <article><span>Duplicate</span><strong>{counts.DUPLICATE||0}</strong><small>otomatis diblokir</small></article>
        <article><span>Database Sync</span><strong>{serverReady?"SYNCED":"..."}</strong><small>{serverReady?"Admin ↔ Client":"menghubungkan..."}</small></article>
      </div>

      <section className="panel" id="import">
        <div className="panel-title"><div><span className="eyebrow">BLIBLI AFFILIATE</span><h2>Tambah produk dari link affiliate</h2><p>Import mencari image otomatis lewat Fast Image Resolver dan baru dinyatakan selesai setelah minimal 1 image tersimpan. Tidak perlu Reload All setelah import.</p></div><CopyCheck size={24}/></div>

        <div className="import-mode-bar">
          <button
            type="button"
            className={importMode==="single"?"import-mode active":"import-mode"}
            onClick={()=>switchImportMode("single")}
          >
            <Link2 size={16}/> Single Link
          </button>
          <button
            type="button"
            className={importMode==="multiple"?"import-mode active":"import-mode"}
            onClick={()=>switchImportMode("multiple")}
          >
            <List size={16}/> Multiple Link
          </button>
        </div>

        <div className={"import-textarea-wrap "+(importMode==="single"?"single":"multiple")}>
          <textarea
            value={text}
            onChange={e=>handleImportTextChange(e.target.value)}
            onPaste={handleImportPaste}
            placeholder={importMode==="single"
              ?"https://s.blibli.com/GNtk/..."
              :"Paste link sebanyak apa pun. Sistem otomatis memisahkan setiap URL yang diawali http/https."
            }
          />
          {importMode==="multiple"&&<div
            className="detected-link-counter"
            aria-live="polite"
            title="Jumlah link unik yang terdeteksi"
          >
            <strong>{detectedLinkCount}</strong>
            <span>LINK</span>
          </div>}
          <button
            type="button"
            className="paste-icon-btn"
            onClick={pasteImportLinks}
            aria-label="Paste link dari clipboard"
            title="Paste link dari clipboard"
          >
            <ClipboardPaste size={20}/>
          </button>
        </div>

        {importMode==="multiple"&&<div className="multiple-link-hint">
          Setiap <strong>http://</strong> atau <strong>https://</strong> yang terdeteksi otomatis dianggap sebagai link/baris baru.
        </div>}

        <div className="actions">
          <p><CheckCircle2 size={16}/> {importMode==="single"
            ?"Single Link aktif — hanya 1 link yang akan diproses."
            :"Multiple Link aktif — link berantakan otomatis dipisah, dirapikan, dicek duplicate, lalu diproses satu per satu."
          }</p>
          <button onClick={analyzeLinks} disabled={busy||!checks.length}>
            {busy&&importJob&&(importJob.status==="queued"||importJob.status==="running")
              ?`Import ${importJob.done}/${importJob.total}`
              :(busy?"Menyiapkan...":"Import Produk")}
          </button>
        </div>
        {importJob&&(importJob.status==="queued"||importJob.status==="running")&&<div className="import-job-progress">
          <div className="import-job-progress-head">
            <strong>BACKGROUND IMPORT</strong>
            <span>{importJob.done}/{importJob.total}</span>
          </div>
          <div className="import-job-track"><i style={{width:`${importJob.total?Math.min(100,Math.round(importJob.done/importJob.total*100)):0}%`}}/></div>
          <small>{importJob.imported} berhasil · {importJob.duplicates} duplicate · {importJob.failed} gagal</small>
          <small>Proses tersimpan di Apps Script dan tetap berjalan walaupun tab ini ditutup.</small>
        </div>}
        {notice&&<div className="notice">{notice}</div>}
      </section>

      {!!checks.length&&<section className="panel">
        <div className="panel-title"><div><span className="eyebrow">PRE-FLIGHT</span><h2>Validasi sebelum import</h2></div></div>
        <div className="table">
          <div className="row head"><span>Link</span><span>Status</span><span>Hasil</span></div>
          {checks.map((row,i)=><div className="row" key={i}>
            <span className="url"><strong>{row.canonicalProductId||"Blibli Affiliate Link"}</strong><small>{row.inputUrl}</small></span>
            <span><b className={"status "+row.status.toLowerCase()}>{row.status}</b></span>
            <span className="reason">{row.reason}</span>
          </div>)}
        </div>
      </section>}

      <section className="panel" id="products">
        <div className="panel-title"><div><span className="eyebrow">PRODUCTS</span><h2>Katalog aktif</h2><p>Admin dan Client memakai data katalog yang sama. Field live-commerce yang diblokir Blibli tidak ditampilkan.</p></div></div>
        <div className="product-admin-list">
          {[...catalog].sort((a,b)=>(b.sequence||0)-(a.sequence||0)).map((item,i)=>{
            const url=item.affiliateUrl||"";
            const meta=resolved[url];
            return <article className="admin-product" key={url||i}>
              <div className="admin-thumb">{meta?.images?.[0]||meta?.image?<img src={meta?.images?.[0]||meta?.image||""} alt=""/>:<span>NO IMAGE</span>}</div>
              <div className="admin-product-body">
                <strong>#{String(item.sequence||i+1).padStart(3,"0")} {meta?.title||"Produk Blibli"}</strong>
                <small>{meta?.canonicalProductId||"Affiliate link aktif"}</small>
                {meta?.images?.length?<div className="admin-gallery">
                  {meta.images.map((src,j)=><img key={src} src={src} alt={`Foto produk ${j+1}`}/>)}
                </div>:null}
                {meta?.images?.length?<small>{meta.images.length} foto katalog tersedia</small>:<small>Image belum tersedia · gunakan Reload All untuk mencoba lagi</small>}
                <div className="admin-meta-data stable-fields">
                  <small><strong>Data tampil:</strong> nama produk · brand · kategori · foto · fitur · Product ID · link affiliate</small>
                  <small><strong>Dicek di Blibli:</strong> harga · diskon · stok · varian · detail penawaran</small>
                </div>
                <div className="admin-product-actions">
                  <a href={url} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Buka Produk di Blibli</a>
                  <button onClick={()=>removeLink(url)} disabled={busy}><Trash2 size={15}/>Hapus</button>
                </div>
              </div>
            </article>
          })}
        </div>
      </section>
    </section>
  </main>;
}
