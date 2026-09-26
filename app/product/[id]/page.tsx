import DynamicProductPage from "@/components/DynamicProductPage";
import {products} from "@/lib/products";
export function generateStaticParams(){return products.map(({id})=>({id}));}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <DynamicProductPage id={id}/>;}
