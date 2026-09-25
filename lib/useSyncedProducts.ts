"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {products as fallbackProducts,type Product} from "@/lib/products";

const ADMIN_ORIGIN="https://skill-fusion-admin.vercel.app";
const BRIDGE_URL=ADMIN_ORIGIN+"/sync-bridge";

type CatalogIdentity={
  sequence?:number;
  canonicalProductId?:string|null;
  canonicalUrl?:string|null;
  affiliateUrl?:string|null;
};

type ResolvedProduct={
  inputUrl?:string;
  finalUrl?:string;
  canonicalUrl?:string|null;
  canonicalProductId?:string|null;
  title?:string|null;
  image?:string|null;
  images?:string[];
  price?:string|null;
  currency?:string|null;
  ok?:boolean;
  message?:string;
};

type CatalogSnapshot={
  type:"skillfusion:catalog-snapshot";
  catalog:CatalogIdentity[];
  resolved:Record<string,ResolvedProduct>;
  sentAt:number;
};

function inferBrand(title:string,id:string){
  const upper=title.toUpperCase();
  if(upper.startsWith("XIAOMI")||id.startsWith("XIO-")) return "XIAOMI";
  if(upper.startsWith("ACMIC")||id.startsWith("ACO-")) return "ACMIC";
  return (title.split(/\s+/)[0]||"TECH").toUpperCase();
}

function inferFeatures(title:string){
  const value=title.toLowerCase();
  const features:string[]=[];
  if(/100\s*cm/.test(value)) features.push("100 cm");
  if(/type\s*-?\s*c|usb\s*c/.test(value)) features.push("USB Type-C");
  if(/fast\s*charging|6a|power delivery|\bpd\b/.test(value)) features.push("Fast charging");
  return features.length?features:["Blibli Affiliate"];
}

function snapshotToProducts(snapshot:CatalogSnapshot):Product[]{
  const rows=snapshot.catalog
    .map((item,index)=>{
      const affiliateUrl=item.affiliateUrl||"";
      const meta=snapshot.resolved?.[affiliateUrl]||{};
      const id=item.canonicalProductId||meta.canonicalProductId||"";
      if(!affiliateUrl||!id) return null;

      const title=(meta.title||fallbackProducts.find(p=>p.id===id)?.name||"Produk Blibli").trim();
      const images=Array.isArray(meta.images)&&meta.images.length
        ? meta.images
        : (meta.image?[meta.image]:fallbackProducts.find(p=>p.id===id)?.images||[]);
      const sequence=typeof item.sequence==="number"?item.sequence:index+1;

      return {
        sequence,
        id,
        canonicalProductId:id,
        name:title,
        brand:inferBrand(title,id),
        category:"Charging & Cable",
        images,
        affiliateUrl,
        badge:"Blibli Affiliate",
        features:inferFeatures(title)
      } satisfies Product;
    })
    .filter((item):item is Product=>Boolean(item));

  if(!rows.length) return fallbackProducts;

  const byId=new Map<string,Product>();
  for(const product of fallbackProducts) byId.set(product.id,product);
  for(const product of rows) byId.set(product.id,product);

  return [...byId.values()].sort((a,b)=>a.sequence-b.sequence);
}

export function useSyncedProducts(){
  const [snapshot,setSnapshot]=useState<CatalogSnapshot|null>(null);
  const [bridgeReady,setBridgeReady]=useState(false);
  const iframeRef=useRef<HTMLIFrameElement|null>(null);

  useEffect(()=>{
    let mounted=true;
    const iframe=document.createElement("iframe");
    iframe.src=BRIDGE_URL;
    iframe.title="Skill Fusion Catalog Sync";
    iframe.setAttribute("aria-hidden","true");
    iframe.tabIndex=-1;
    Object.assign(iframe.style,{
      position:"fixed",
      width:"1px",
      height:"1px",
      opacity:"0",
      pointerEvents:"none",
      left:"-9999px",
      bottom:"0",
      border:"0"
    });
    iframeRef.current=iframe;

    function request(){
      try{
        iframe.contentWindow?.postMessage({type:"skillfusion:catalog-request"},ADMIN_ORIGIN);
      }catch{}
    }

    function onMessage(event:MessageEvent){
      if(event.origin!==ADMIN_ORIGIN) return;
      if(event.data?.type!=="skillfusion:catalog-snapshot") return;
      if(!mounted) return;
      setSnapshot(event.data as CatalogSnapshot);
      setBridgeReady(true);
    }

    iframe.addEventListener("load",request);
    window.addEventListener("message",onMessage);
    document.body.appendChild(iframe);

    const requestTimer=window.setInterval(request,2500);
    const readyTimer=window.setTimeout(()=>setBridgeReady(true),3500);

    return ()=>{
      mounted=false;
      window.clearInterval(requestTimer);
      window.clearTimeout(readyTimer);
      window.removeEventListener("message",onMessage);
      iframe.removeEventListener("load",request);
      iframe.remove();
      iframeRef.current=null;
    };
  },[]);

  const syncedProducts=useMemo(
    ()=>snapshot?snapshotToProducts(snapshot):fallbackProducts,
    [snapshot]
  );

  return {products:syncedProducts,bridgeReady,lastSync:snapshot?.sentAt||null};
}
