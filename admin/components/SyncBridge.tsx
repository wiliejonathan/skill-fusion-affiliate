"use client";

import {useEffect,useState} from "react";

const CATALOG_KEY="skill-fusion:admin:catalog:v1";
const RESOLVED_KEY="skill-fusion:admin:resolved:v1";
const CLIENT_ORIGINS=new Set([
  "https://skill-fusion-client.vercel.app",
  "https://skill-fusion-client-wiliejonathan1999-3095.vercel.app"
]);

type CatalogIdentity={
  sequence?:number;
  canonicalProductId?:string|null;
  canonicalUrl?:string|null;
  affiliateUrl?:string|null;
};

type ResolvedProduct={
  inputUrl:string;
  finalUrl:string;
  canonicalUrl:string|null;
  canonicalProductId:string|null;
  title:string|null;
  image:string|null;
  images:string[];
  price:string|null;
  currency:string|null;
  ok:boolean;
  message?:string;
};

function readCatalog():CatalogIdentity[]{
  try{
    const raw=window.localStorage.getItem(CATALOG_KEY);
    const parsed=raw?JSON.parse(raw):[];
    if(!Array.isArray(parsed)) return [];
    return parsed.map((item,index)=>({
      ...item,
      sequence:typeof item?.sequence==="number"?item.sequence:index+1
    }));
  }catch{return []}
}

function readResolved():Record<string,ResolvedProduct>{
  try{
    const raw=window.localStorage.getItem(RESOLVED_KEY);
    const parsed=raw?JSON.parse(raw):{};
    return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed:{};
  }catch{return {}}
}

function writeState(catalog:CatalogIdentity[],resolved:Record<string,ResolvedProduct>){
  window.localStorage.setItem(CATALOG_KEY,JSON.stringify(catalog));
  window.localStorage.setItem(RESOLVED_KEY,JSON.stringify(resolved));
}

export default function SyncBridge(){
  const [status,setStatus]=useState("READY");

  useEffect(()=>{
    let running=false;

    async function repairAndSnapshot(target?:Window|null,targetOrigin?:string){
      if(running) return;
      running=true;
      try{
        let catalog=readCatalog();
        let resolved=readResolved();
        let changed=false;

        for(let index=0;index<catalog.length;index++){
          const item=catalog[index];
          const url=item.affiliateUrl||"";
          if(!url) continue;

          if(typeof item.sequence!=="number"){
            catalog[index]={...item,sequence:index+1};
            changed=true;
          }

          const meta=resolved[url];
          const needsRepair=!meta||!Array.isArray(meta.images)||meta.images.length===0;
          if(!needsRepair) continue;

          const source=item.canonicalUrl||meta?.canonicalUrl||url;
          try{
            const res=await fetch("/api/resolve?url="+encodeURIComponent(source),{cache:"no-store"});
            const data:ResolvedProduct=await res.json();
            if(data){
              resolved={...resolved,[url]:{...meta,...data,inputUrl:url}};
              catalog[index]={
                ...catalog[index],
                canonicalProductId:data.canonicalProductId||catalog[index].canonicalProductId,
                canonicalUrl:data.canonicalUrl||catalog[index].canonicalUrl
              };
              changed=true;
            }
          }catch{}
        }

        if(changed) writeState(catalog,resolved);

        const payload={
          type:"skillfusion:catalog-snapshot",
          catalog,
          resolved,
          sentAt:Date.now()
        };

        if(target&&targetOrigin&&CLIENT_ORIGINS.has(targetOrigin)){
          target.postMessage(payload,targetOrigin);
        }

        if(window.parent!==window){
          for(const origin of CLIENT_ORIGINS){
            try{window.parent.postMessage(payload,origin)}catch{}
          }
        }

        setStatus("SYNCED");
      }finally{
        running=false;
      }
    }

    function onMessage(event:MessageEvent){
      if(!CLIENT_ORIGINS.has(event.origin)) return;
      if(event.data?.type==="skillfusion:catalog-request"){
        repairAndSnapshot(event.source as Window,event.origin);
      }
    }

    function onStorage(event:StorageEvent){
      if(event.key===CATALOG_KEY||event.key===RESOLVED_KEY){
        repairAndSnapshot();
      }
    }

    window.addEventListener("message",onMessage);
    window.addEventListener("storage",onStorage);
    repairAndSnapshot();

    const timer=window.setInterval(()=>repairAndSnapshot(),3000);

    return ()=>{
      window.removeEventListener("message",onMessage);
      window.removeEventListener("storage",onStorage);
      window.clearInterval(timer);
    };
  },[]);

  return <main style={{
    minHeight:"100vh",
    display:"grid",
    placeItems:"center",
    background:"#050a12",
    color:"#7ddfff",
    fontFamily:"monospace"
  }}>
    <span>SKILL FUSION CATALOG BRIDGE // {status}</span>
  </main>;
}
