"use client";

import {requestAppsScript} from "../shared/apps-script";
import {useEffect,useState} from "react";
import {products as fallbackProducts,type Product} from "@/lib/products";

export function useSyncedProducts(initialProducts:Product[]=fallbackProducts){
  const [products,setProducts]=useState<Product[]>(initialProducts.length?initialProducts:fallbackProducts);
  const [lastSync,setLastSync]=useState<number|null>(null);
  const [bridgeReady,setBridgeReady]=useState(false);

  useEffect(()=>{
    let mounted=true;
    let pending=false;

    async function sync(){
      if(pending||document.visibilityState==="hidden") return;
      pending=true;
      try{
        const data=await requestAppsScript("catalog");
        if(!mounted) return;
        if(data?.ok&&Array.isArray(data.products)){
          setProducts(data.products);
          setLastSync(Date.now());
        }
        setBridgeReady(true);
      }catch{
        if(mounted) setBridgeReady(true);
      }finally{pending=false;}
    }

    sync();
    const timer=window.setInterval(sync,30000);
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
