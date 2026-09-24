"use client";

import { useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import ProductCard from "./ProductCard";
import { brands, categories, products } from "@/lib/products";

const MAX_PRICE = 25000000;

export default function Marketplace() {
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("Semua");
  const [selectedBrands,setSelectedBrands]=useState<string[]>([]);
  const [minPrice,setMinPrice]=useState(0);
  const [maxPrice,setMaxPrice]=useState(MAX_PRICE);
  const [minRating,setMinRating]=useState(0);
  const [minScore,setMinScore]=useState(0);
  const [sortBy,setSortBy]=useState("recommended");
  const [mobileFilters,setMobileFilters]=useState(false);
  const [wishlist,setWishlist]=useState<string[]>([]);
  const [compare,setCompare]=useState<string[]>([]);

  function toggleBrand(brand:string){
    setSelectedBrands(function(current){
      return current.includes(brand) ? current.filter(function(x){return x!==brand;}) : current.concat(brand);
    });
  }

  const filtered=useMemo(function(){
    const q=query.trim().toLowerCase();
    const result=products.filter(function(p){
      const searchable=[p.name,p.brand,p.category].concat(p.features).join(" ").toLowerCase();
      return (!q || searchable.includes(q))
        && (category==="Semua" || p.category===category)
        && (!selectedBrands.length || selectedBrands.includes(p.brand))
        && p.price>=minPrice && p.price<=maxPrice
        && p.rating>=minRating && p.skillScore>=minScore;
    });
    result.sort(function(a,b){
      if(sortBy==="price-low") return a.price-b.price;
      if(sortBy==="price-high") return b.price-a.price;
      if(sortBy==="rating") return b.rating-a.rating || b.reviews-a.reviews;
      if(sortBy==="trending") return b.trendScore-a.trendScore;
      if(sortBy==="score") return b.skillScore-a.skillScore;
      return b.skillScore-a.skillScore || b.trendScore-a.trendScore;
    });
    return result;
  },[query,category,selectedBrands,minPrice,maxPrice,minRating,minScore,sortBy]);

  const activeCount=(category!=="Semua"?1:0)+selectedBrands.length+(minPrice>0?1:0)+(maxPrice<MAX_PRICE?1:0)+(minRating>0?1:0)+(minScore>0?1:0);

  function clearFilters(){
    setCategory("Semua"); setSelectedBrands([]); setMinPrice(0); setMaxPrice(MAX_PRICE); setMinRating(0); setMinScore(0);
  }

  function toggleWishlist(id:string){
    setWishlist(function(current){return current.includes(id)?current.filter(function(x){return x!==id;}):current.concat(id);});
  }

  function toggleCompare(id:string){
    setCompare(function(current){
      if(current.includes(id)) return current.filter(function(x){return x!==id;});
      if(current.length>=4) return current;
      return current.concat(id);
    });
  }

  const filters=(
    <div className="filters-inner">
      <div className="filter-head">
        <div><span className="eyebrow">Filter produk</span><h2>Temukan tech yang pas</h2></div>
        {mobileFilters?<button className="icon-btn" onClick={()=>setMobileFilters(false)}><X size={18}/></button>:null}
      </div>

      <div className="filter-section">
        <label>Kategori</label>
        <div className="category-list">
          {categories.map(function(item){return <button key={item} className={category===item?"category-item active":"category-item"} onClick={()=>setCategory(item)}>{item}</button>;})}
        </div>
      </div>

      <div className="filter-section">
        <label>Range harga</label>
        <div className="price-inputs">
          <input type="number" min={0} step={50000} value={minPrice} onChange={(e)=>setMinPrice(Math.max(0,Number(e.target.value)))} aria-label="Harga minimum"/>
          <span>—</span>
          <input type="number" min={0} step={50000} value={maxPrice} onChange={(e)=>setMaxPrice(Math.max(0,Number(e.target.value)))} aria-label="Harga maksimum"/>
        </div>
        <input className="range-input" type="range" min={0} max={MAX_PRICE} step={250000} value={maxPrice} onChange={(e)=>setMaxPrice(Number(e.target.value))}/>
      </div>

      <div className="filter-section">
        <label>Brand</label>
        <div className="check-list">
          {brands.map(function(brand){return <label key={brand} className="check-row"><input type="checkbox" checked={selectedBrands.includes(brand)} onChange={()=>toggleBrand(brand)}/><span>{brand}</span></label>;})}
        </div>
      </div>

      <div className="filter-section">
        <label>Rating minimum</label>
        <div className="segmented">
          {[0,4,4.5,4.8].map(function(r){return <button key={r} className={minRating===r?"active":""} onClick={()=>setMinRating(r)}>{r===0?"Semua":String(r)+"+ ★"}</button>;})}
        </div>
      </div>

      <div className="filter-section">
        <label>Skill Fusion Score</label>
        <div className="segmented">
          {[0,80,85,90].map(function(s){return <button key={s} className={minScore===s?"active":""} onClick={()=>setMinScore(s)}>{s===0?"Semua":String(s)+"+"}</button>;})}
        </div>
      </div>

      {activeCount>0?<button className="clear-btn" onClick={clearFilters}>Hapus semua filter ({activeCount})</button>:null}
      <div className="demo-note"><Sparkles size={16}/><span>Data produk saat ini demo. Feed affiliate resmi dipasang pada tahap integrasi.</span></div>
    </div>
  );

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#"><span className="brand-mark">SF</span><span><strong>Skill Fusion</strong><small>Smart Tech Worth Buying</small></span></a>
          <div className="desktop-search"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Cari gadget, smartphone, smart home, charger..."/></div>
          <div className="header-stats"><span>♡ {wishlist.length}</span><span>⇄ {compare.length}/4</span></div>
        </div>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">CURATED TECHNOLOGY MARKETPLACE</span>
          <h1>Temukan teknologi yang benar-benar layak dibeli.</h1>
          <p>Filter gadget berdasarkan harga, rating, spesifikasi dan Skill Fusion Score — lalu pilih penawaran terbaik dari partner affiliate.</p>
        </div>
        <div className="hero-score"><span>Skill Fusion Score</span><strong>0–100</strong><small>Relevance · Value · Trend · Buyer Intent · Economics</small></div>
      </section>

      <div className="mobile-search"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Cari produk teknologi..."/></div>

      <div className="market-layout">
        <aside className="filter-sidebar">{filters}</aside>
        <main className="catalog">
          <div className="catalog-toolbar">
            <div><span className="eyebrow">DISCOVER</span><h2>{filtered.length} produk ditemukan</h2></div>
            <div className="toolbar-actions">
              <button className="filter-trigger" onClick={()=>setMobileFilters(true)}><Filter size={17}/>Filter{activeCount>0?<span>{activeCount}</span>:null}</button>
              <label className="sort-control"><SlidersHorizontal size={17}/><select value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
                <option value="recommended">Recommended</option><option value="score">Skill Fusion Score</option><option value="trending">Trending</option><option value="rating">Rating tertinggi</option><option value="price-low">Harga terendah</option><option value="price-high">Harga tertinggi</option>
              </select></label>
            </div>
          </div>

          {activeCount>0?<div className="active-filters">
            {category!=="Semua"?<span>{category}</span>:null}
            {selectedBrands.map(function(b){return <span key={b}>{b}</span>;})}
            {minRating>0?<span>Rating {minRating}+</span>:null}
            {minScore>0?<span>Score {minScore}+</span>:null}
            {maxPrice<MAX_PRICE?<span>Maks. Rp{Math.round(maxPrice/1000000)} jt</span>:null}
            <button onClick={clearFilters}>Clear all</button>
          </div>:null}

          {filtered.length?<div className="product-grid">{filtered.map(function(p){return <ProductCard key={p.id} product={p} wished={wishlist.includes(p.id)} compared={compare.includes(p.id)} onWishlist={toggleWishlist} onCompare={toggleCompare}/>;})}</div>
          :<div className="empty-state"><span>🔎</span><h3>Tidak ada produk yang cocok.</h3><p>Coba ubah keyword atau longgarkan filter.</p><button onClick={clearFilters}>Reset filter</button></div>}
        </main>
      </div>

      {mobileFilters?<div className="mobile-filter-overlay"><div className="mobile-filter-sheet">{filters}</div></div>:null}

      {compare.length>0?<div className="compare-bar"><span><strong>{compare.length}</strong> produk dipilih untuk dibandingkan</span><button disabled={compare.length<2}>Bandingkan Sekarang</button></div>:null}
    </>
  );
}
