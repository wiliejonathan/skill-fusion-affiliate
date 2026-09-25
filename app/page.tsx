import Marketplace from "@/components/Marketplace";
import {products as fallbackProducts,type Product} from "@/lib/products";

export const dynamic="force-dynamic";
export const revalidate=0;

async function getInitialProducts():Promise<Product[]>{
  try{
    const res=await fetch("https://skill-fusion-client.vercel.app/api/catalog?ts="+Date.now(),{cache:"no-store"});
    if(!res.ok) return fallbackProducts;
    const data=await res.json();
    return data?.ok&&Array.isArray(data.products)&&data.products.length?data.products:fallbackProducts;
  }catch{
    return fallbackProducts;
  }
}

export default async function Home(){
  const initialProducts=await getInitialProducts();
  return <Marketplace initialProducts={initialProducts}/>;
}
