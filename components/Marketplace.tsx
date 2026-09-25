"use client";

import {useMemo,useState} from "react";
import {ArrowRight,AtSign,Cpu,Filter,Search,ShieldCheck,Sparkles,X,Zap} from "lucide-react";
import BrandLogo from "./BrandLogo";
import ProductCard from "./ProductCard";
import {categories,products} from "@/lib/products";

const IG_OWNER="https://www.instagram.com/wilie_jonathan/";
const IG_BRAND="https://www.instagram.com/skill.fusion.id/";

export default function Marketplace(){
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("Semua");
  const [mobileFilters,setMobileFilters]=useState(false);
  const [wishlist,setWishlist]=useState<string[]>([]);

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return products.filter(p=>{
      const searchable=[p.name,p.brand,p.category,...p.features].join(" ").toLowerCase();
      return (!q||searchable.includes(q))&&(category==="Semua"||p.category===category);
    });
  },[query,category]);

  function toggleWishlist(id:string){
    setWishlist(cur=>cur.includes(id)?cur.filter(x=>x!==id):[...cur,id]);
  }

  function scrollProducts(){
    document.getElementById("catalog")?.scrollIntoView({behavior:"smooth",block:"start"});
  }

  const filters=<div className="filters-inner tech-filter">
    <div className="filter-head">
      <div><span className="eyebrow">FILTER MATRIX</span><h2>Product Class</h2></div>
      {mobileFilters?<button className="icon-btn" onClick={()=>setMobileFilters(false)}><X size={18}/></button>:null}
    </div>
    <div className="filter-section">
      <div className="category-list">
        {categories.map((item,i)=><button key={item} className={category===item?"category-item active":"category-item"} onClick={()=>{setCategory(item);setMobileFilters(false)}}>
          <span className="cat-index">0{i+1}</span><span>{item}</span>
        </button>)}
      </div>
    </div>
    <div className="filter-system-note">
      <ShieldCheck size={16}/>
      <span>Catalog source: Skill Fusion Admin → Blibli Affiliate</span>
    </div>
  </div>;

  return <div className="tech-site">
    <div className="top-rail">
      <div className="top-rail-inner">
        <span><i className="pulse-dot"/> SYSTEM ONLINE</span>
        <span className="rail-divider"/>
        <a href={IG_OWNER} target="_blank" rel="noreferrer">OWNER // @wilie_jonathan</a>
        <span className="rail-divider"/>
        <a href={IG_BRAND} target="_blank" rel="noreferrer">BRAND // @skill.fusion.id</a>
      </div>
    </div>

    <header className="site-header tech-header">
      <div className="header-inner">
        <a className="brand" href="#" aria-label="Skill Fusion Home"><BrandLogo/></a>
        <div className="desktop-search tech-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search curated tech..."/></div>
        <div className="header-actions">
          <a className="header-ig" href={IG_BRAND} target="_blank" rel="noreferrer"><AtSign size={17}/><span>@skill.fusion.id</span></a>
          <span className="wishlist-chip">WISHLIST {String(wishlist.length).padStart(2,"0")}</span>
        </div>
      </div>
    </header>

    <main>
      <section className="hero tech-hero">
        <div className="hero-grid-overlay"/>
        <div className="hero-scan"/>
        <div className="hero-copy">
          <div className="hero-kicker"><span className="bracket">[</span> CURATED TECHNOLOGY INTELLIGENCE <span className="bracket">]</span></div>
          <h1><span>SMART TECH.</span><br/><strong>BETTER SIGNAL.</strong></h1>
          <p>Skill Fusion menyaring gadget dan teknologi yang layak dipertimbangkan—dengan katalog ringkas, foto produk lengkap, dan jalur langsung ke penawaran affiliate.</p>
          <div className="hero-actions">
            <button className="mech-button primary" onClick={scrollProducts}><span>EXPLORE CATALOG</span><ArrowRight size={17}/></button>
            <a className="mech-button ghost" href={IG_BRAND} target="_blank" rel="noreferrer"><AtSign size={17}/><span>FOLLOW BRAND</span></a>
          </div>
          <div className="identity-strip">
            <div><small>OWNER</small><a href={IG_OWNER} target="_blank" rel="noreferrer">@wilie_jonathan</a></div>
            <div><small>BRAND CHANNEL</small><a href={IG_BRAND} target="_blank" rel="noreferrer">@skill.fusion.id</a></div>
            <div><small>FOCUS</small><strong>TECH · GADGET · SMART GEAR</strong></div>
          </div>
        </div>

        <div className="hero-core" aria-hidden="true">
          <div className="core-orbit orbit-a"/>
          <div className="core-orbit orbit-b"/>
          <div className="core-orbit orbit-c"/>
          <div className="core-center">
            <BrandLogo compact/>
            <span>TECH CORE</span>
          </div>
          <div className="core-node node-a"><Cpu size={18}/></div>
          <div className="core-node node-b"><Zap size={18}/></div>
          <div className="core-node node-c"><Sparkles size={18}/></div>
        </div>
      </section>

      <div className="mobile-search tech-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari produk teknologi..."/></div>

      <section className="catalog-section" id="catalog">
        <div className="catalog-heading">
          <div><span className="eyebrow">PRODUCT MATRIX</span><h2>Featured Tech</h2><p>Card dapat diklik untuk membuka product detail, gallery besar, dan route affiliate.</p></div>
          <div className="catalog-counter"><span>RESULT</span><strong>{String(filtered.length).padStart(2,"0")}</strong></div>
        </div>

        <div className="market-layout">
          <aside className="filter-sidebar">{filters}</aside>
          <div className="catalog">
            <div className="catalog-toolbar">
              <div><span className="catalog-status"><i className="pulse-dot"/> LIVE CATALOG</span></div>
              <button className="filter-trigger" onClick={()=>setMobileFilters(true)}><Filter size={17}/>Filter</button>
            </div>
            {filtered.length?<div className="product-grid">{filtered.map(p=><ProductCard key={p.id} product={p} wished={wishlist.includes(p.id)} onWishlist={toggleWishlist}/>)}</div>:<div className="empty-state"><span>NO SIGNAL</span><h3>Produk tidak ditemukan.</h3><p>Coba keyword lain.</p><button onClick={()=>{setQuery("");setCategory("Semua")}}>RESET MATRIX</button></div>}
          </div>
        </div>
      </section>

      <section className="brand-banner">
        <div className="brand-banner-grid"/>
        <div>
          <span className="eyebrow">SKILL FUSION / PERSONAL BRAND</span>
          <h2>Technology discovery with a sharper point of view.</h2>
          <p>Built around curated tech, clean product intelligence, and affiliate routing for Indonesia.</p>
        </div>
        <div className="banner-socials">
          <a href={IG_OWNER} target="_blank" rel="noreferrer"><span>OWNER</span><strong>@wilie_jonathan</strong><ArrowRight size={17}/></a>
          <a href={IG_BRAND} target="_blank" rel="noreferrer"><span>INSTAGRAM BRAND</span><strong>@skill.fusion.id</strong><ArrowRight size={17}/></a>
        </div>
      </section>
    </main>

    <footer className="tech-footer">
      <BrandLogo/>
      <div><span>© 2026 Skill Fusion</span><span>Curated Tech Affiliate Marketplace</span></div>
      <div className="footer-links"><a href={IG_OWNER} target="_blank" rel="noreferrer">@wilie_jonathan</a><a href={IG_BRAND} target="_blank" rel="noreferrer">@skill.fusion.id</a></div>
    </footer>

    {mobileFilters?<div className="mobile-filter-overlay" onClick={()=>setMobileFilters(false)}><div className="mobile-filter-sheet" onClick={e=>e.stopPropagation()}>{filters}</div></div>:null}
  </div>;
}
