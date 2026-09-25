"use client";

import {useMemo,useState} from "react";
import {CheckCircle2,CopyCheck,ExternalLink,LayoutDashboard,Link2,PackageSearch,ShieldCheck,Trash2} from "lucide-react";
import {parseBlibliImportUrl,type ImportCandidate} from "@/lib/importer";
import {checkImports,type CatalogIdentity} from "@/lib/dedupe";

type ResolvedProduct = {
  inputUrl:string;
  finalUrl:string;
  canonicalUrl:string|null;
  canonicalProductId:string|null;
  title:string|null;
  image:string|null;
  price:string|null;
  currency:string|null;
  ok:boolean;
  message?:string;
};

const FIRST_LINK="https://s.blibli.com/GNtk/0qrtsw3f";

const initialCatalog:CatalogIdentity[]=[
  {affiliateUrl:FIRST_LINK}
];

export default function AdminPage(){
  const [text,setText]=useState(FIRST_LINK);
  const [catalog,setCatalog]=useState<CatalogIdentity[]>(initialCatalog);
  const [resolved,setResolved]=useState<Record<string,ResolvedProduct>>({});
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");

  const checks=useMemo(()=>{
    const lines=[...new Set(text.split(/\r?\n|\s+(?=https?:\/\/)/).map(x=>x.trim()).filter(Boolean))];
    const candidates:Array<ImportCandidate|{invalidUrl:string}>=lines.map(line=>{
      try{return parseBlibliImportUrl(line)}catch{return {invalidUrl:line}}
    });
    return checkImports(candidates,catalog);
  },[text,catalog]);

  const counts=checks.reduce((acc,row)=>{
    acc[row.status]=(acc[row.status]||0)+1;
    return acc;
  },{} as Record<string,number>);

  async function analyzeLinks(){
    const valid=checks.filter(x=>x.status!=="INVALID");
    if(!valid.length){setNotice("Tidak ada link Blibli yang valid.");return}
    setBusy(true); setNotice("");
    const next={...resolved};
    for(const item of valid){
      try{
        const res=await fetch("/api/resolve?url="+encodeURIComponent(item.inputUrl),{cache:"no-store"});
        const data=await res.json();
        next[item.inputUrl]=data;
      }catch{
        next[item.inputUrl]={
          inputUrl:item.inputUrl,finalUrl:item.inputUrl,canonicalUrl:null,canonicalProductId:null,
          title:null,image:null,price:null,currency:null,ok:false,message:"Metadata belum bisa dibaca. Link affiliate tetap valid."
        };
      }
    }
    setResolved(next);
    setBusy(false);
    setNotice("Analisis selesai. Link affiliate pertama sudah tercatat di katalog.");
  }

  function removeLink(url:string){
    setCatalog(prev=>prev.filter(x=>x.affiliateUrl!==url));
    setResolved(prev=>{const n={...prev};delete n[url];return n});
  }

  return <main className="shell">
    <aside>
      <div className="brand"><div className="mark">SF</div><div><strong>Skill Fusion</strong><small>ADMIN</small></div></div>
      <nav>
        <a className="active" href="#dashboard"><LayoutDashboard size={18}/>Dashboard</a>
        <a href="#import"><Link2 size={18}/>Import Affiliate</a>
        <a href="#products"><PackageSearch size={18}/>Products</a>
      </nav>
      <div className="secure"><ShieldCheck size={18}/><span>Website admin terpisah dari website client.</span></div>
    </aside>

    <section className="content">
      <header id="dashboard">
        <div><span className="eyebrow">CATALOG CONTROL CENTER</span><h1>Skill Fusion Admin</h1><p>Kelola link affiliate Blibli, cek duplicate, lalu publikasikan ke katalog client.</p></div>
        <div className="pill">ADMIN</div>
      </header>

      <div className="stats">
        <article><span>Produk tersimpan</span><strong>{catalog.length}</strong><small>produk katalog</small></article>
        <article><span>Link baru</span><strong>{counts.READY||0}</strong><small>siap dianalisis</small></article>
        <article><span>Duplicate</span><strong>{counts.DUPLICATE||0}</strong><small>otomatis diblokir</small></article>
        <article><span>Status katalog</span><strong>LIVE</strong><small>1 produk client</small></article>
      </div>

      <section className="panel" id="import">
        <div className="panel-title"><div><span className="eyebrow">BLIBLI AFFILIATE</span><h2>Import link affiliate</h2><p>Paste satu atau banyak link. Shortlink Blibli dianggap valid dan dianalisis otomatis saat tombol dijalankan.</p></div><CopyCheck size={24}/></div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={"Paste satu link per baris\nhttps://s.blibli.com/GNtk/..."} />
        <div className="actions">
          <p><CheckCircle2 size={16}/> Duplicate dicek dari Product ID jika tersedia, canonical URL, lalu affiliate URL. Status internal teknis tidak lagi ditampilkan ke user.</p>
          <button onClick={analyzeLinks} disabled={busy||!checks.length}>{busy?"Menganalisis...":"Analisis Link"}</button>
        </div>
        {notice&&<div className="notice">{notice}</div>}
      </section>

      {!!checks.length&&<section className="panel">
        <div className="panel-title"><div><span className="eyebrow">PRE-FLIGHT</span><h2>Validasi link</h2></div></div>
        <div className="table">
          <div className="row head"><span>Link</span><span>Status</span><span>Hasil</span></div>
          {checks.map((row,i)=><div className="row" key={i}>
            <span className="url"><strong>{row.canonicalProductId||"Blibli Affiliate Link"}</strong><small>{row.inputUrl}</small></span>
            <span><b className={"status "+row.status.toLowerCase()}>{row.status}</b></span>
            <span className="reason">{row.reason}</span>
          </div>)}
        </div>
      </section>}

      <section className="panel" id="products">
        <div className="panel-title"><div><span className="eyebrow">PRODUCTS</span><h2>Katalog aktif</h2><p>Hanya produk yang benar-benar kamu masukkan yang ditampilkan.</p></div></div>
        <div className="product-admin-list">
          {catalog.map((item,i)=>{
            const url=item.affiliateUrl||"";
            const meta=resolved[url];
            return <article className="admin-product" key={url||i}>
              <div className="admin-thumb">{meta?.image?<img src={meta.image} alt=""/>:<span>SF</span>}</div>
              <div className="admin-product-body">
                <strong>{meta?.title||"Produk Blibli #1"}</strong>
                <small>{meta?.canonicalProductId||"Link affiliate aktif"}</small>
                {meta?.price?<b>{meta.currency==="IDR"?"Rp ":""}{meta.price}</b>:null}
                <div className="admin-product-actions">
                  <a href={url} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Buka Affiliate Link</a>
                  <button onClick={()=>removeLink(url)}><Trash2 size={15}/>Hapus</button>
                </div>
              </div>
            </article>
          })}
        </div>
      </section>
    </section>
  </main>;
}
