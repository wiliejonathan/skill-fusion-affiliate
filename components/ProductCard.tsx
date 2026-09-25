"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {ChevronLeft,ChevronRight,ExternalLink,Heart} from "lucide-react";
import type {Product} from "@/lib/products";

type Props={product:Product;wished:boolean;onWishlist:(id:string)=>void};

export default function ProductCard({product:p,wished,onWishlist}:Props){
  const router=useRouter();
  const [active,setActive]=useState(0);
  const images=p.images||[];
  const count=images.length;
  const detailUrl=`/product/${encodeURIComponent(p.id)}`;

  function openDetail(){
    router.push(detailUrl);
  }

  function stop(e:React.MouseEvent){
    e.stopPropagation();
  }

  const prev=(e:React.MouseEvent)=>{
    stop(e);
    setActive(i=>(i-1+count)%count);
  };
  const next=(e:React.MouseEvent)=>{
    stop(e);
    setActive(i=>(i+1)%count);
  };

  return <article
    className="product-card clickable-card"
    role="link"
    tabIndex={0}
    aria-label={`Lihat detail ${p.name}`}
    onClick={openDetail}
    onKeyDown={e=>{
      if(e.key==="Enter"||e.key===" "){
        e.preventDefault();
        openDetail();
      }
    }}
  >
    <div className="product-visual gallery-visual">
      {images[active]?<img className="product-photo" src={images[active]} alt={p.name+` foto ${active+1}`}/>:null}
      <span className="product-badge">{p.badge}</span>
      <div className="card-actions">
        <button
          className={wished?"icon-btn active":"icon-btn"}
          onClick={e=>{stop(e);onWishlist(p.id)}}
          aria-label="Wishlist"
        >
          <Heart size={17} fill={wished?"currentColor":"none"}/>
        </button>
      </div>

      {count>1?<>
        <button className="gallery-arrow gallery-prev" onClick={prev} aria-label="Foto sebelumnya"><ChevronLeft size={18}/></button>
        <button className="gallery-arrow gallery-next" onClick={next} aria-label="Foto berikutnya"><ChevronRight size={18}/></button>
        <span className="gallery-count">{active+1}/{count}</span>
      </>:null}
    </div>

    {count>1?<div className="gallery-thumbs" onClick={stop}>
      {images.map((src,i)=><button
        key={src}
        className={i===active?"thumb active":"thumb"}
        onClick={e=>{stop(e);setActive(i)}}
        aria-label={`Buka foto ${i+1}`}
      >
        <img src={src} alt=""/>
      </button>)}
    </div>:null}

    <div className="product-body">
      <div className="product-meta"><span>{p.brand}</span><span>{p.category}</span></div>
      <h3>{p.name}</h3>
      <div className="feature-list">{p.features.map(x=><span key={x}>{x}</span>)}</div>
      <div className="price-block">
        <strong>Cek harga terbaru di Blibli</strong>
        <div><span className="live-note">Harga dan stok mengikuti halaman Blibli.</span></div>
      </div>
      <div className="card-detail-hint">Klik card untuk lihat detail & foto lebih besar</div>
      <a
        className="cta-btn"
        href={p.affiliateUrl}
        target="_blank"
        rel="sponsored noreferrer"
        onClick={stop}
      >
        Buka Produk di Blibli <ExternalLink size={15}/>
      </a>
    </div>
  </article>;
}
