"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,Heart,Trash2} from "lucide-react";
import BrandLogo from "./BrandLogo";
import ProductCard from "./ProductCard";
import {products} from "@/lib/products";
import {readWishlist,toggleWishlistId,writeWishlist} from "@/lib/wishlist";

export default function WishlistView(){
  const [wishlist,setWishlist]=useState<string[]>([]);

  useEffect(()=>{
    setWishlist(readWishlist());
    const sync=()=>setWishlist(readWishlist());
    window.addEventListener("storage",sync);
    window.addEventListener("skillfusion:wishlist",sync as EventListener);
    return ()=>{
      window.removeEventListener("storage",sync);
      window.removeEventListener("skillfusion:wishlist",sync as EventListener);
    };
  },[]);

  const savedProducts=useMemo(
    ()=>products.filter(product=>wishlist.includes(product.id)),
    [wishlist]
  );

  function toggle(id:string){
    setWishlist(toggleWishlistId(id));
  }

  function clearAll(){
    writeWishlist([]);
    setWishlist([]);
  }

  return <div className="tech-site wishlist-page">
    <header className="site-header tech-header">
      <div className="header-inner wishlist-header-inner">
        <Link className="brand" href="/"><BrandLogo/></Link>
        <Link className="back-link mech-link" href="/"><ArrowLeft size={15}/> KEMBALI KE KATALOG</Link>
      </div>
    </header>

    <main className="wishlist-main">
      <section className="wishlist-hero tech-panel">
        <div>
          <span className="eyebrow">PERSONAL COLLECTION</span>
          <h1>Wishlist</h1>
          <p>Produk yang kamu tandai dengan icon love akan tersimpan di perangkat ini dan tetap ada setelah halaman direfresh.</p>
        </div>
        <div className="wishlist-total">
          <Heart size={20} fill="currentColor"/>
          <strong>{String(savedProducts.length).padStart(2,"0")}</strong>
          <span>SAVED</span>
        </div>
      </section>

      {savedProducts.length?<>
        <div className="wishlist-toolbar">
          <span>{savedProducts.length} produk tersimpan</span>
          <button onClick={clearAll}><Trash2 size={14}/> Hapus semua</button>
        </div>
        <div className="product-grid wishlist-grid">
          {savedProducts.map(product=>
            <ProductCard
              key={product.id}
              product={product}
              wished={true}
              onWishlist={toggle}
            />
          )}
        </div>
      </>:<section className="wishlist-empty tech-panel">
        <Heart size={38}/>
        <h2>Wishlist masih kosong</h2>
        <p>Tekan icon love pada card atau halaman detail produk untuk menyimpan produk di sini.</p>
        <Link className="mech-button primary" href="/">LIHAT KATALOG</Link>
      </section>}
    </main>
  </div>;
}
