"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {AtSign,Check,ChevronLeft,ChevronRight,ExternalLink,Heart,ScanLine,Share2,X,ZoomIn} from "lucide-react";
import BrandLogo from "./BrandLogo";
import type {Product} from "@/lib/products";
import {readWishlist,toggleWishlistId} from "@/lib/wishlist";
import {requestAppsScript} from "@/shared/apps-script";

const IG_OWNER="https://www.instagram.com/wilie_jonathan/";
const IG_BRAND="https://www.instagram.com/skill.fusion.id/";

export default function ProductDetail({product}:{product:Product}){
  const [active,setActive]=useState(0);
  const [liked,setLiked]=useState(false);
  const [lightbox,setLightbox]=useState(false);
  const [shareState,setShareState]=useState<"idle"|"shared"|"copied">("idle");
  const [livePrice,setLivePrice]=useState({price:product.price||null,currency:product.currency||null,updatedAt:product.priceUpdatedAt||null,loading:false});
  const images=product.images||[];
  const count=images.length;
  const formattedPrice=useMemo(()=>{
    const raw=String(livePrice.price||"").trim();
    if(!raw) return null;
    const numeric=Number(raw.replace(/[^0-9]/g,""));
    if(!Number.isFinite(numeric)||numeric<=0) return null;
    if((livePrice.currency||"IDR").toUpperCase()==="IDR"){
      return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(numeric);
    }
    return `${livePrice.currency||""} ${new Intl.NumberFormat("id-ID").format(numeric)}`.trim();
  },[livePrice.price,livePrice.currency]);
  const description=String(product.description||"").trim()||
    `${product.name} adalah produk ${product.category.toLowerCase()} dari ${product.brand}. ${product.features.length?`Fitur utama: ${product.features.join(", ")}.`:""}`;

  useEffect(()=>{
    let mounted=true;
    setLivePrice({price:product.price||null,currency:product.currency||null,updatedAt:product.priceUpdatedAt||null,loading:true});

    async function refreshLivePrice(){
      try{
        const data=await requestAppsScript("price",{id:product.id});
        if(!mounted)return;
        setLivePrice({
          price:data?.price||product.price||null,
          currency:data?.currency||product.currency||null,
          updatedAt:data?.priceUpdatedAt||product.priceUpdatedAt||null,
          loading:false
        });
      }catch{
        if(mounted)setLivePrice(prev=>({...prev,loading:false}));
      }
    }

    refreshLivePrice();
    return ()=>{mounted=false};
  },[product.id,product.price,product.currency,product.priceUpdatedAt]);

  useEffect(()=>{
    setLiked(readWishlist().includes(product.id));
    const sync=()=>setLiked(readWishlist().includes(product.id));
    window.addEventListener("storage",sync);
    window.addEventListener("skillfusion:wishlist",sync as EventListener);
    return ()=>{
      window.removeEventListener("storage",sync);
      window.removeEventListener("skillfusion:wishlist",sync as EventListener);
    };
  },[product.id]);

  function toggleDetailWishlist(){
    const next=toggleWishlistId(product.id);
    setLiked(next.includes(product.id));
  }

  const prev=()=>setActive(i=>(i-1+count)%count);
  const next=()=>setActive(i=>(i+1)%count);

  async function shareProduct(){
    const url=window.location.href;
    const data={title:product.name,text:`Lihat ${product.name} di Skill Fusion`,url};

    try{
      if(navigator.share){
        await navigator.share(data);
        setShareState("shared");
      }else{
        await navigator.clipboard.writeText(url);
        setShareState("copied");
      }
    }catch(err){
      if(err instanceof DOMException && err.name==="AbortError") return;
      try{
        await navigator.clipboard.writeText(url);
        setShareState("copied");
      }catch{
        const temp=document.createElement("textarea");
        temp.value=url;
        temp.style.position="fixed";
        temp.style.opacity="0";
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        temp.remove();
        setShareState("copied");
      }
    }

    window.setTimeout(()=>setShareState("idle"),1800);
  }

  return <div className="tech-site detail-shell">
    <div className="top-rail"><div className="top-rail-inner"><span><i className="pulse-dot"/> PRODUCT INTELLIGENCE</span><span className="rail-divider"/><a href={IG_OWNER} target="_blank" rel="noreferrer">@wilie_jonathan</a><span className="rail-divider"/><a href={IG_BRAND} target="_blank" rel="noreferrer">@skill.fusion.id</a></div></div>
    <header className="site-header tech-header detail-header">
      <div className="header-inner detail-header-inner">
        <Link className="brand" href="/"><BrandLogo/></Link>
        <Link className="back-link mech-link" href="/">← BACK TO CATALOG</Link>
      </div>
    </header>

    <main className="product-detail-page">
      <div className="detail-breadcrumb"><Link href="/">HOME</Link><span>/</span><span>{product.category}</span><span>/</span><strong>{product.brand}</strong></div>

      <section className="detail-grid">
        <div className="detail-gallery tech-panel">
          <div className="detail-panel-label"><span>MEDIA ARRAY</span><strong>{String(active+1).padStart(2,"0")} / {String(count).padStart(2,"0")}</strong></div>
          <div className="detail-main-image-wrap">
            {images[active]?<button className="detail-main-image-button" onClick={()=>setLightbox(true)} aria-label="Perbesar foto">
              <img className="detail-main-image" src={images[active]} alt={product.name+` foto ${active+1}`}/>
              <span className="zoom-label"><ZoomIn size={16}/> ENLARGE</span>
            </button>:null}
            {count>1?<>
              <button className="detail-arrow detail-prev" onClick={prev} aria-label="Foto sebelumnya"><ChevronLeft size={24}/></button>
              <button className="detail-arrow detail-next" onClick={next} aria-label="Foto berikutnya"><ChevronRight size={24}/></button>
            </>:null}
            <div className="detail-scanline"/>
          </div>
          {count>1?<div className="detail-thumbs">{images.map((src,i)=><button key={src} className={i===active?"detail-thumb active":"detail-thumb"} onClick={()=>setActive(i)} aria-label={`Pilih foto ${i+1}`}><img src={src} alt=""/><span>{String(i+1).padStart(2,"0")}</span></button>)}</div>:null}
        </div>

        <div className="detail-info tech-panel">
          <div className="detail-panel-label"><span>PRODUCT CORE</span><strong>ACTIVE</strong></div>
          <div className="detail-topline">
            <span className="detail-badge">{product.badge}</span>
            <div className="detail-actions">
              <button className="detail-share" onClick={shareProduct} aria-label="Bagikan produk">
                {shareState==="idle"?<Share2 size={18}/>:<Check size={18}/>}
              </button>
              <button
                className={liked?"detail-like wishlist-heart active":"detail-like wishlist-heart"}
                onClick={toggleDetailWishlist}
                aria-label={liked?"Hapus dari wishlist":"Simpan ke wishlist"}
                aria-pressed={liked}
              >
                <Heart size={18} fill={liked?"currentColor":"none"}/>
              </button>
            </div>
          </div>
          <div className="detail-action-feedbacks">
            {liked?<span className="detail-wishlist-feedback">♥ TERSIMPAN DI WISHLIST</span>:null}
            {shareState!=="idle"?<span className="detail-share-feedback">{shareState==="shared"?"DIBAGIKAN":"LINK DISALIN"}</span>:null}
          </div>
          <div className="detail-meta">{product.brand} // {product.category}</div>
          <h1><span className="detail-sequence">#{String(product.sequence).padStart(3,"0")}</span> {product.name}</h1>
          <div className="detail-product-id"><ScanLine size={14}/> PRODUCT ID // {product.canonicalProductId}</div>

          <div className="detail-price-box">
            <span>LIVE MARKET PRICE</span>
            <strong>{formattedPrice||"CHECK @ BLIBLI"}</strong>
            <small>{livePrice.loading?"Memeriksa harga Blibli terbaru...":livePrice.updatedAt?"Live cache diperbarui "+new Date(livePrice.updatedAt).toLocaleString("id-ID"):"Harga, promo, varian, dan stok mengikuti halaman merchant."}</small>
          </div>

          <div className="detail-description">
            <h2>PRODUCT DESCRIPTION</h2>
            <p>{description}</p>
          </div>

          <div className="detail-specs">
            <h2>PRODUCT SIGNALS</h2>
            <div className="detail-feature-grid">{product.features.map((feature,i)=><div key={feature}><span>0{i+1}</span><strong>{feature}</strong></div>)}</div>
          </div>

          <a className="detail-buy-button mech-button primary" href={product.affiliateUrl} target="_blank" rel="sponsored noreferrer">OPEN BLIBLI ROUTE <ExternalLink size={18}/></a>
          <p className="affiliate-note">Affiliate route maintained by Skill Fusion.</p>
        </div>
      </section>

      <section className="detail-more tech-panel">
        <div className="detail-panel-label"><span>FULL MEDIA GRID</span><strong>{String(count).padStart(2,"0")} FILES</strong></div>
        <h2>Product Gallery</h2>
        <p>Klik gambar untuk membuka full-screen viewer.</p>
        <div className="detail-gallery-grid">{images.map((src,i)=><button key={src} onClick={()=>{setActive(i);setLightbox(true)}} aria-label={`Perbesar foto ${i+1}`}><img src={src} alt={product.name+` foto ${i+1}`}/><span>{String(i+1).padStart(2,"0")}</span></button>)}</div>
      </section>

      <section className="detail-owner-bar tech-panel">
        <BrandLogo compact/>
        <div><small>OWNER</small><a href={IG_OWNER} target="_blank" rel="noreferrer">@wilie_jonathan</a></div>
        <div><small>BRAND</small><a href={IG_BRAND} target="_blank" rel="noreferrer">@skill.fusion.id</a></div>
        <a className="detail-instagram" href={IG_BRAND} target="_blank" rel="noreferrer"><AtSign size={17}/> FOLLOW</a>
      </section>
    </main>

    {lightbox&&images[active]?<div className="lightbox" role="dialog" aria-modal="true" aria-label="Foto produk ukuran besar">
      <div className="lightbox-grid"/>
      <button className="lightbox-close" onClick={()=>setLightbox(false)} aria-label="Tutup"><X size={24}/></button>
      {count>1?<button className="lightbox-arrow lightbox-prev" onClick={prev} aria-label="Foto sebelumnya"><ChevronLeft size={30}/></button>:null}
      <img src={images[active]} alt={product.name+` foto besar ${active+1}`}/>
      {count>1?<button className="lightbox-arrow lightbox-next" onClick={next} aria-label="Foto berikutnya"><ChevronRight size={30}/></button>:null}
      <div className="lightbox-count">MEDIA // {String(active+1).padStart(2,"0")} / {String(count).padStart(2,"0")}</div>
    </div>:null}
  </div>;
}
