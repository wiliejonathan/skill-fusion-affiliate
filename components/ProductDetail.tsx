"use client";

import {useState} from "react";
import Link from "next/link";
import {ChevronLeft,ChevronRight,ExternalLink,Heart,X,ZoomIn} from "lucide-react";
import type {Product} from "@/lib/products";

export default function ProductDetail({product}:{product:Product}){
  const [active,setActive]=useState(0);
  const [liked,setLiked]=useState(false);
  const [lightbox,setLightbox]=useState(false);
  const images=product.images||[];
  const count=images.length;

  const prev=()=>setActive(i=>(i-1+count)%count);
  const next=()=>setActive(i=>(i+1)%count);

  return <>
    <header className="site-header detail-header">
      <div className="header-inner detail-header-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">SF</span>
          <span><strong>Skill Fusion</strong><small>Smart Tech Worth Buying</small></span>
        </Link>
        <Link className="back-link" href="/">← Kembali ke katalog</Link>
      </div>
    </header>

    <main className="product-detail-page">
      <div className="detail-breadcrumb">
        <Link href="/">Home</Link><span>/</span><span>{product.category}</span><span>/</span><strong>{product.brand}</strong>
      </div>

      <section className="detail-grid">
        <div className="detail-gallery">
          <div className="detail-main-image-wrap">
            {images[active]?<button className="detail-main-image-button" onClick={()=>setLightbox(true)} aria-label="Perbesar foto">
              <img className="detail-main-image" src={images[active]} alt={product.name+` foto ${active+1}`}/>
              <span className="zoom-label"><ZoomIn size={16}/> Perbesar</span>
            </button>:null}

            {count>1?<>
              <button className="detail-arrow detail-prev" onClick={prev} aria-label="Foto sebelumnya"><ChevronLeft size={24}/></button>
              <button className="detail-arrow detail-next" onClick={next} aria-label="Foto berikutnya"><ChevronRight size={24}/></button>
              <span className="detail-image-count">{active+1} / {count}</span>
            </>:null}
          </div>

          {count>1?<div className="detail-thumbs">
            {images.map((src,i)=><button key={src} className={i===active?"detail-thumb active":"detail-thumb"} onClick={()=>setActive(i)} aria-label={`Pilih foto ${i+1}`}>
              <img src={src} alt=""/>
            </button>)}
          </div>:null}
        </div>

        <div className="detail-info">
          <div className="detail-topline">
            <span className="detail-badge">{product.badge}</span>
            <button className={liked?"detail-like active":"detail-like"} onClick={()=>setLiked(v=>!v)} aria-label="Wishlist">
              <Heart size={18} fill={liked?"currentColor":"none"}/>
            </button>
          </div>

          <div className="detail-meta">{product.brand} · {product.category}</div>
          <h1>{product.name}</h1>
          <div className="detail-product-id">Product ID: {product.canonicalProductId}</div>

          <div className="detail-price-box">
            <span>Harga terbaru</span>
            <strong>Cek langsung di Blibli</strong>
            <small>Harga, promo, varian dan stok mengikuti halaman Blibli saat kamu membuka penawaran.</small>
          </div>

          <div className="detail-specs">
            <h2>Highlight Produk</h2>
            <div className="detail-feature-grid">
              {product.features.map(feature=><div key={feature}><span>✓</span><strong>{feature}</strong></div>)}
            </div>
          </div>

          <a className="detail-buy-button" href={product.affiliateUrl} target="_blank" rel="sponsored noreferrer">
            Buka Produk di Blibli <ExternalLink size={18}/>
          </a>
          <p className="affiliate-note">Link ini menggunakan link affiliate Skill Fusion.</p>
        </div>
      </section>

      <section className="detail-more">
        <h2>Galeri Produk</h2>
        <p>Klik foto untuk melihat ukuran lebih besar.</p>
        <div className="detail-gallery-grid">
          {images.map((src,i)=><button key={src} onClick={()=>{setActive(i);setLightbox(true)}} aria-label={`Perbesar foto ${i+1}`}>
            <img src={src} alt={product.name+` foto ${i+1}`}/>
          </button>)}
        </div>
      </section>
    </main>

    {lightbox&&images[active]?<div className="lightbox" role="dialog" aria-modal="true" aria-label="Foto produk ukuran besar">
      <button className="lightbox-close" onClick={()=>setLightbox(false)} aria-label="Tutup"><X size={24}/></button>
      {count>1?<button className="lightbox-arrow lightbox-prev" onClick={prev} aria-label="Foto sebelumnya"><ChevronLeft size={30}/></button>:null}
      <img src={images[active]} alt={product.name+` foto besar ${active+1}`}/>
      {count>1?<button className="lightbox-arrow lightbox-next" onClick={next} aria-label="Foto berikutnya"><ChevronRight size={30}/></button>:null}
      <div className="lightbox-count">{active+1} / {count}</div>
    </div>:null}
  </>;
}
