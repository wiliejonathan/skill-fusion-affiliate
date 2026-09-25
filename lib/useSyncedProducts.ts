"use client";

import {useEffect,useState} from "react";
import {products as fallbackProducts,type Product} from "@/lib/products";

export function useSyncedProducts(){
  const [products,setProducts]=useState<Product[]>(fallbackProducts);
  const [lastSync,setLastSync]=useState<number|null>(null);
  const [bridgeReady,setBridgeReady]=useState(false);

  useEffect(()=>{
    let mounted=true;

    async function sync(){
      try{
        const res=await fetch("/api/catalog?ts="+Date.now(),{cache:"no-store"});
        if(!res.ok) throw new Error("catalog sync failed");
        const data=await res.json();
        if(!mounted) return;
        if(data?.ok&&Array.isArray(data.products)&&data.products.length){
          setProducts(data.products);
          setLastSync(Date.now());
        }
        setBridgeReady(true);
      }catch{
        if(mounted) setBridgeReady(true);
      }
    }

    sync();
    const timer=window.setInterval(sync,2500);
    const onVisible=()=>{if(document.visibilityState==="visible") sync()};
    document.addEventListener("visibilitychange",onVisible);

    return ()=>{
      mounted=false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange",onVisible);
    };
  },[]);

  return {products,bridgeReady,lastSync};
}
