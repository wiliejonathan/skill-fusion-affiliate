import {notFound} from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import {products} from "@/lib/products";

export function generateStaticParams(){
  return products.map(product=>({id:product.id}));
}

export default async function ProductPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const product=products.find(p=>p.id===decodeURIComponent(id));
  if(!product) notFound();
  return <ProductDetail product={product}/>;
}
