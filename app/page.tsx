import Marketplace from "@/components/Marketplace";
import snapshot from "@/lib/catalog-snapshot.json";
import type {Product} from "@/lib/products";

export default function Home(){
  return <Marketplace initialProducts={snapshot as Product[]}/>;
}
