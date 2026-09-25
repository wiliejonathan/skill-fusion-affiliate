"use client";

import {useMemo,useState} from "react";
import {Filter,Search,Sparkles,X} from "lucide-react";
import ProductCard from "./ProductCard";
import {categories,products} from "@/lib/products";

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

  const filters=<div className="filters-inner">
    <div className="filter-head">
      <div><span className="eyebrow">Filter produk</span><h2>Kategori</h2></div>
      {mobileFilters?<button className="icon-btn" onClick={()=>setMobileFilters(false)}><X size={18}/></button>:null}
    </div>
    <div className="filter-section">
      <div className="category-list">
        {categories.map(item=><button key={item} className={category===item?"category-item active":"category-item"} onClick={()=>{setCategory(item);setMobileFilters(false)}}>{item}</button>)}
      </div>
    </div>
    <div className="demo-note"><Sparkles size={16}/><span>Katalog ini hanya menampilkan produk yang dimasukkan melalui Skill Fusion Admin.</span></div>
  </div>;

  return <>
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#"><span className="brand-mark">SF</span><span><strong>Skill Fusion</strong><small>Smart Tech Worth Buying</small></span></a>
        <div className="desktop-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari produk teknologi..."/></div>
        <div className="header-stats"><span>♡ {wishlist.length}</span></div>
      </div>
    </header>

    <section className="hero">
      <div>
        <span className="eyebrow">CURATED TECHNOLOGY MARKETPLACE</span>
        <h1>Produk teknologi pilihan Skill Fusion.</h1>
        <p>Hanya produk affiliate yang sudah dimasukkan dari dashboard admin. Tidak ada katalog demo atau produk palsu.</p>
      </div>
      <div className="hero-score"><span>Produk aktif</span><strong>{products.length}</strong><small>Blibli Affiliate · Indonesia</small></div>
    </section>

    <div className="mobile-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari produk..."/></div>

    <div className="market-layout">
      <aside className="filter-sidebar">{filters}</aside>
      <main className="catalog">
        <div className="catalog-toolbar">
          <div><span className="eyebrow">DISCOVER</span><h2>{filtered.length} produk ditemukan</h2></div>
          <button className="filter-trigger" onClick={()=>setMobileFilters(true)}><Filter size={17}/>Filter</button>
        </div>
        {filtered.length?<div className="product-grid">{filtered.map(p=><ProductCard key={p.id} product={p} wished={wishlist.includes(p.id)} onWishlist={toggleWishlist}/>)}</div>:<div className="empty-state"><span>🔎</span><h3>Produk tidak ditemukan.</h3><p>Coba keyword lain.</p><button onClick={()=>{setQuery("");setCategory("Semua")}}>Reset pencarian</button></div>}
      </main>
    </div>

    {mobileFilters?<div className="mobile-filter-overlay" onClick={()=>setMobileFilters(false)}><div className="mobile-filter-sheet" onClick={e=>e.stopPropagation()}>{filters}</div></div>:null}
  </>;
}
