"use client";

import {Heart,ExternalLink} from "lucide-react";
import type {Product} from "@/lib/products";

type Props={product:Product;wished:boolean;onWishlist:(id:string)=>void};

export default function ProductCard({product:p,wished,onWishlist}:Props){
  return <article className="product-card">
    <div className="product-visual">
      <span className="product-icon">{p.icon}</span>
      <span className="product-badge">{p.badge}</span>
      <div className="card-actions">
        <button className={wished?"icon-btn active":"icon-btn"} onClick={()=>onWishlist(p.id)} aria-label="Wishlist">
          <Heart size={17} fill={wished?"currentColor":"none"}/>
        </button>
      </div>
    </div>
    <div className="product-body">
      <div className="product-meta"><span>{p.brand}</span><span>{p.category}</span></div>
      <h3>{p.name}</h3>
      <div className="feature-list">{p.features.map(x=><span key={x}>{x}</span>)}</div>
      <div className="price-block">
        <strong>Cek harga terbaru di Blibli</strong>
        <div><span className="live-note">Harga dan stok mengikuti halaman Blibli.</span></div>
      </div>
      <a className="cta-btn" href={p.affiliateUrl} target="_blank" rel="sponsored noreferrer">
        Buka Produk di Blibli <ExternalLink size={15}/>
      </a>
    </div>
  </article>;
}
