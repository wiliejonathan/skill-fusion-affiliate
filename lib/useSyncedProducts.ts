"use client";

import {requestAppsScript} from "../shared/apps-script";
import {useEffect,useMemo,useState} from "react";
import snapshot from "@/lib/catalog-snapshot.json";
import {products as legacyFallback,type Product} from "@/lib/products";

const snapshotProducts=snapshot as Product[];

function bestFallback(initialProducts:Product[]){
  const candidates=[
    Array.isArray(initialProducts)?initialProducts:[],
    snapshotProducts,
    legacyFallback
  ];
  return candidates.reduce<Product[]>((best,current)=>current.length>best.length?current:best,[]);
}

export function useSyncedProducts(initialProducts:Product[]=snapshotProducts){
  const fallback=useMemo(()=>bestFallback(initialProducts),[initialProducts]);
  const [products,setProducts]=useState<Product[]>(fallback);
  const [lastSync,setLastSync]=useState<number|null>(null);
  const [bridgeReady,setBridgeReady]=useState(false);

  useEffect(()=>{
    if(fallback.length>products.length) setProducts(fallback);
    // Only react to a materially better fallback; live catalog remains authoritative.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[fallback.length]);

  useEffect(()=>{
    let mounted=true;
    let pending=false;

    async function sync(){
      if(pending||document.visibilityState==="hidden") return;
      pending=true;
      try{
        const data=await requestAppsScript("catalog");
        if(!mounted) return;
        if(data?.ok&&Array.isArray(data.products)&&data.products.length){
          setProducts(data.products);
          setLastSync(Date.now());
        }
        setBridgeReady(true);
      }catch{
        if(mounted){
          // Keep the full static snapshot instead of collapsing to the five
          // legacy demo products when the Apps Script deployment is replaced.
          setProducts(current=>current.length>=fallback.length?current:fallback);
          setBridgeReady(true);
        }
      }finally{pending=false;}
    }

    void sync();
    const timer=window.setInterval(sync,5000);
    const onVisible=()=>{if(document.visibilityState==="visible") void sync()};
    document.addEventListener("visibilitychange",onVisible);

    return ()=>{
      mounted=false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange",onVisible);
    };
  },[fallback]);

  return {products,bridgeReady,lastSync};
}
