"use client";

import Link from "next/link";
import ProductDetail from "@/components/ProductDetail";
import {useSyncedProducts} from "@/lib/useSyncedProducts";

export default function DynamicProductPage({id}:{id:string}){
  const {products,bridgeReady}=useSyncedProducts();
  const product=products.find(item=>item.id===id);

  if(product) return <ProductDetail product={product}/>;

  if(!bridgeReady){
    return <main className="detail-not-found">
      <div>
        <span>SYNC</span>
        <h1>Menyinkronkan produk...</h1>
        <p>Memuat katalog terbaru dari Skill Fusion Admin.</p>
      </div>
    </main>;
  }

  return <main className="detail-not-found">
    <div>
      <span>404</span>
      <h1>Produk tidak ditemukan</h1>
      <p>Produk mungkin sudah dihapus atau belum tersinkron.</p>
      <Link href="/">Kembali ke katalog</Link>
    </div>
  </main>;
}
