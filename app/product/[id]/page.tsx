import DynamicProductPage from "@/components/DynamicProductPage";

export default async function ProductPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <DynamicProductPage id={decodeURIComponent(id)}/>;
}
