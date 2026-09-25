"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {ChevronLeft,ChevronRight,ExternalLink,Heart,ScanLine} from "lucide-react";
import type {Product} from "@/lib/products";

type Props={product:Product;wished:boolean;onWishlist:(id:string)=>void};

export default function ProductCard({product:p,wished,onWishlist}:Props){
  const router=useRouter();
  const [active,setActive]=useState(0);
  const [navigating,setNavigating]=useState(false);
  const images=p.images||[];
  const count=images.length;
  const detailUrl=`/product/${encodeURIComponent(p.id)}`;

  function openDetail(){
    if(navigating) return;
    setNavigating(true);
    window.setTimeout(()=>router.push(detailUrl),300);
  }

  function stop(e:React.MouseEvent){e.stopPropagation()}

  const prev=(e:React.MouseEvent)=>{stop(e);setActive(i=>(i-1+count)%count)};
  const next=(e:React.MouseEvent)=>{stop(e);setActive(i=>(i+1)%count)};

  return <>
    <article
      className={navigating?"product-card clickable-card routing":"product-card clickable-card"}
      role="link"
      tabIndex={0}
      aria-label={`Lihat detail ${p.name}`}
      onClick={openDetail}
      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openDetail()}}}
    >
      <div className="card-tech-rail"><span>SF // 01</span><span>MEDIA {String(count).padStart(2,"0")}</span></div>
      <div className="product-visual gallery-visual">
        {images[active]?<img className="product-photo" src={images[active]} alt={p.name+` foto ${active+1}`}/>:null}
        <span className="product-badge">{p.badge}</span>
        <div className="card-actions">
          <button className={wished?"icon-btn active":"icon-btn"} onClick={e=>{stop(e);onWishlist(p.id)}} aria-label="Wishlist"><Heart size={17} fill={wished?"currentColor":"none"}/></button>
        </div>
        {count>1?<>
          <button className="gallery-arrow gallery-prev" onClick={prev} aria-label="Foto sebelumnya"><ChevronLeft size={18}/></button>
          <button className="gallery-arrow gallery-next" onClick={next} aria-label="Foto berikutnya"><ChevronRight size={18}/></button>
          <span className="gallery-count">{active+1}/{count}</span>
        </>:null}
        <div className="card-scanline"/>
      </div>

      {count>1?<div className="gallery-thumbs" onClick={stop}>
        {images.map((src,i)=><button key={src} className={i===active?"thumb active":"thumb"} onClick={e=>{stop(e);setActive(i)}} aria-label={`Buka foto ${i+1}`}><img src={src} alt=""/></button>)}
      </div>:null}

      <div className="product-body">
        <div className="product-meta"><span>{p.brand}</span><span>{p.category}</span></div>
        <h3>{p.name}</h3>
        <div className="product-id-line"><ScanLine size={13}/><span>{p.canonicalProductId}</span></div>
        <div className="feature-list">{p.features.map(x=><span key={x}>{x}</span>)}</div>
        <div className="price-block"><strong>LIVE PRICE @ BLIBLI</strong><div><span className="live-note">Harga & stok mengikuti halaman merchant.</span></div></div>
        <div className="card-detail-hint">OPEN PRODUCT INTELLIGENCE →</div>
        <a className="cta-btn" href={p.affiliateUrl} target="_blank" rel="sponsored noreferrer" onClick={stop}>Buka di Blibli <ExternalLink size={15}/></a>
      </div>
    </article>

    {navigating?<div className="mechanical-transition" aria-hidden="true">
      <div className="mech-panel mech-left"/><div className="mech-panel mech-right"/>
      <div className="mech-center"><span>ACCESSING PRODUCT</span><i/></div>
    </div>:null}
  </>;
}
