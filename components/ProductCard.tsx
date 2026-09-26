"use client";

import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {Check,ChevronLeft,ChevronRight,ExternalLink,Heart,ScanLine,Share2} from "lucide-react";
import type {Product} from "@/lib/products";
import {requestAppsScript} from "@/shared/apps-script";

type Props={product:Product;wished:boolean;onWishlist:(id:string)=>void};

export default function ProductCard({product:p,wished,onWishlist}:Props){
  const router=useRouter();
  const [active,setActive]=useState(0);
  const [navigating,setNavigating]=useState(false);
  const [shareState,setShareState]=useState<"idle"|"shared"|"copied">("idle");
  const [wishlistFeedback,setWishlistFeedback]=useState<"idle"|"saved"|"removed">("idle");
  const [cardPrice,setCardPrice]=useState({price:p.price||null,currency:p.currency||null});
  const images=p.images||[];
  const count=images.length;
  const detailUrl=`/product?id=${encodeURIComponent(p.id)}`;

  const formattedPrice=useMemo(()=>{
    const raw=String(cardPrice.price||"").trim();
    if(!raw) return null;

    const numeric=Number(raw.replace(/[^0-9]/g,""));
    if(!Number.isFinite(numeric)||numeric<=0) return null;

    if((cardPrice.currency||"IDR").toUpperCase()==="IDR"){
      return new Intl.NumberFormat("id-ID",{
        style:"currency",
        currency:"IDR",
        maximumFractionDigits:0
      }).format(numeric);
    }

    return `${cardPrice.currency||""} ${new Intl.NumberFormat("id-ID").format(numeric)}`.trim();
  },[cardPrice.price,cardPrice.currency]);

  async function contributeLivePrice(){
    try{
      const data=await requestAppsScript("price",{id:p.id});
      if(data?.price){
        setCardPrice({
          price:data.price,
          currency:data.currency||p.currency||"IDR"
        });
      }
    }catch{
      // Navigation must never be blocked by a live-price refresh failure.
    }
  }

  function openDetail(){
    if(navigating) return;
    setNavigating(true);
    void contributeLivePrice();
    window.setTimeout(()=>router.push(detailUrl),300);
  }

  function stop(e:React.MouseEvent){e.stopPropagation()}

  async function shareProduct(e:React.MouseEvent){
    stop(e);
    const url=window.location.origin+(process.env.NEXT_PUBLIC_BASE_PATH||"/skill-fusion-affiliate")+detailUrl;
    const data={title:p.name,text:`Lihat ${p.name} di Skill Fusion`,url};

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
      <div className="card-tech-rail"><span>SF // #{String(p.sequence).padStart(3,"0")}</span><span>MEDIA {String(count).padStart(2,"0")}</span></div>
      <div className="product-visual gallery-visual">
        {images[active]?<img className="product-photo" src={images[active]} alt={p.name+` foto ${active+1}`}/>:null}
        <span className="product-badge">{p.badge}</span>
        <div className="card-actions">
          <button className="icon-btn share-icon-btn" onClick={shareProduct} aria-label="Bagikan produk">
            {shareState==="idle"?<Share2 size={17}/>:<Check size={17}/>}
          </button>
          <button
            className={wished?"icon-btn wishlist-heart active":"icon-btn wishlist-heart"}
            onClick={e=>{
              stop(e);
              const nextSaved=!wished;
              onWishlist(p.id);
              setWishlistFeedback(nextSaved?"saved":"removed");
              window.setTimeout(()=>setWishlistFeedback("idle"),1500);
            }}
            aria-label={wished?"Hapus dari wishlist":"Simpan ke wishlist"}
            aria-pressed={wished}
          >
            <Heart size={17} fill={wished?"currentColor":"none"}/>
          </button>
        </div>
        {shareState!=="idle"?<span className="share-feedback">{shareState==="shared"?"SHARED":"LINK COPIED"}</span>:null}
        {wishlistFeedback!=="idle"?<span className="wishlist-feedback">{wishlistFeedback==="saved"?"TERSIMPAN":"DIHAPUS"}</span>:null}
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
        <h3><span className="product-sequence">#{String(p.sequence).padStart(3,"0")}</span> {p.name}</h3>
        <div className="product-id-line"><ScanLine size={13}/><span>{p.canonicalProductId}</span></div>
        <div className="feature-list">{p.features.map(x=><span key={x}>{x}</span>)}</div>
        <div className="price-block">
          <strong>LIVE PRICE @ BLIBLI</strong>
          {formattedPrice
            ? <div className="live-price">{formattedPrice}</div>
            : <div className="live-price pending">Harga mengikuti Blibli</div>
          }
          <span className="live-note">Harga & stok mengikuti halaman merchant.</span>
        </div>
        <div className="card-detail-hint">OPEN PRODUCT INTELLIGENCE →</div>
        <a className="cta-btn" href={p.affiliateUrl} target="_blank" rel="sponsored noreferrer" onClick={e=>{stop(e);void contributeLivePrice();}}>Buka di Blibli <ExternalLink size={15}/></a>
      </div>
    </article>

    {navigating?<div className="mechanical-transition" aria-hidden="true">
      <div className="mech-panel mech-left"/><div className="mech-panel mech-right"/>
      <div className="mech-center"><span>ACCESSING PRODUCT</span><i/></div>
    </div>:null}
  </>;
}
