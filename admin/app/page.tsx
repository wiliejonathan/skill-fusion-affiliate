"use client";

import {useEffect,useMemo,useState} from "react";
import {CheckCircle2,CopyCheck,ExternalLink,LayoutDashboard,Link2,PackageSearch,RefreshCw,ShieldCheck,Trash2} from "lucide-react";
import {parseBlibliImportUrl,type ImportCandidate} from "@/lib/importer";
import {checkImports,type CatalogIdentity} from "@/lib/dedupe";

type ResolvedProduct={
  inputUrl:string; finalUrl:string; canonicalUrl:string|null; canonicalProductId:string|null;
  title:string|null; image:string|null; images:string[]; price:string|null; currency:string|null; ok:boolean; message?:string;
};

type DbProduct={
  sequence:number;
  id:string;
  canonicalProductId:string;
  name:string;
  brand:string;
  category:string;
  images:string[];
  affiliateUrl:string;
  canonicalUrl:string|null;
  badge:string;
  features:string[];
};

const FIRST_LINK="https://s.blibli.com/GNtk/0qrtsw3f";
const FIRST_FINAL="https://www.blibli.com/p/acmic-braided-line-kabel-data-charger-100cm-fast-charging-cable-gc100-gl100-gm100/is--ACO-60021-00244-00014?pickupPointCode=PP-3538803&share_link=1&utm_campaign=affiliate_share&utm_content=salin_link&utm_medium=aff_6ab567e244d6d2a8c322863d&utm_source=affiliates";
const FIRST_CANONICAL="https://www.blibli.com/p/acmic-braided-line-kabel-data-charger-100cm-fast-charging-cable-gc100-gl100-gm100/is--ACO-60021-00244-00014";
const FIRST_TITLE="ACMIC Braided Line Kabel Data Charger 100cm Fast Charging Cable GC100 / GL100 / GM100";

const initialCatalog:CatalogIdentity[]=[{
  sequence:1,
  affiliateUrl:FIRST_LINK,
  canonicalProductId:"ACO-60021-00244-00014",
  canonicalUrl:FIRST_CANONICAL
}];

const STORAGE_CATALOG_KEY="skill-fusion:admin:catalog:v1";
const STORAGE_RESOLVED_KEY="skill-fusion:admin:resolved:v1";
const STORAGE_GALLERY_RESCAN_KEY="skill-fusion:admin:gallery-rescan:v2";

const initialResolved:Record<string,ResolvedProduct>={
  [FIRST_LINK]:{
    inputUrl:FIRST_LINK,finalUrl:FIRST_FINAL,canonicalUrl:FIRST_CANONICAL,
    canonicalProductId:"ACO-60021-00244-00014",title:FIRST_TITLE,
    image:"https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full45_njeqi5ul.jpg",
    images:[
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full45_njeqi5ul.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full15_ph0p14k5.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full16_mwsi08wd.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full17_fecq856n.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full18_gr5fkrpk.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full44_k26116c9.jpg"
    ],
    price:null,currency:null,ok:true
  }
};

function inferBrand(title:string,id:string){
  const upper=title.toUpperCase();
  if(upper.startsWith("XIAOMI")||id.startsWith("XIO-")) return "XIAOMI";
  if(upper.startsWith("ACMIC")||id.startsWith("ACO-")) return "ACMIC";
  return (title.split(/\s+/)[0]||"TECH").toUpperCase();
}

function inferFeatures(title:string){
  const value=title.toLowerCase();
  const features:string[]=[];
  if(/100\s*cm/.test(value)) features.push("100 cm");
  if(/type\s*-?\s*c|usb\s*c/.test(value)) features.push("USB Type-C");
  if(/power delivery|\bpd\b/.test(value)) features.push("Power Delivery");
  else if(/fast\s*charging|6a/.test(value)) features.push("Fast charging");
  return features.length?features:["Blibli Affiliate"];
}

function buildDbProducts(catalog:CatalogIdentity[],resolved:Record<string,ResolvedProduct>):DbProduct[]{
  const products:DbProduct[]=[];
  catalog.forEach((item,index)=>{
    const affiliateUrl=item.affiliateUrl||"";
    const meta=resolved[affiliateUrl];
    const id=item.canonicalProductId||meta?.canonicalProductId||"";
    if(!affiliateUrl||!id) return;

    const name=(meta?.title||"Produk Blibli").trim();
    const images=meta?.images?.length?meta.images:(meta?.image?[meta.image]:[]);

    products.push({
      sequence:item.sequence||index+1,
      id,
      canonicalProductId:id,
      name,
      brand:inferBrand(name,id),
      category:"Charging & Cable",
      images,
      affiliateUrl,
      canonicalUrl:item.canonicalUrl||meta?.canonicalUrl||null,
      badge:"Blibli Affiliate",
      features:inferFeatures(name)
    });
  });
  return products;
}

function dbToLocal(products:DbProduct[]){
  const catalog:CatalogIdentity[]=products.map(p=>({
    sequence:p.sequence,
    affiliateUrl:p.affiliateUrl,
    canonicalProductId:p.canonicalProductId,
    canonicalUrl:p.canonicalUrl||null
  }));
  const resolved:Record<string,ResolvedProduct>={};
  for(const p of products){
    resolved[p.affiliateUrl]={
      inputUrl:p.affiliateUrl,
      finalUrl:p.affiliateUrl,
      canonicalUrl:p.canonicalUrl||null,
      canonicalProductId:p.canonicalProductId,
      title:p.name,
      image:p.images?.[0]||null,
      images:p.images||[],
      price:null,
      currency:null,
      ok:true
    };
  }
  return {catalog,resolved};
}

export default function AdminPage(){
  const [text,setText]=useState("");
  const [catalog,setCatalog]=useState<CatalogIdentity[]>(initialCatalog);
  const [resolved,setResolved]=useState<Record<string,ResolvedProduct>>(initialResolved);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [hydrated,setHydrated]=useState(false);
  const [serverReady,setServerReady]=useState(false);
  const [refreshingUrl,setRefreshingUrl]=useState<string|null>(null);
  const [productNotice,setProductNotice]=useState<Record<string,string>>({});

  async function pushDatabase(nextCatalog:CatalogIdentity[],nextResolved:Record<string,ResolvedProduct>){
    const products=buildDbProducts(nextCatalog,nextResolved);
    if(!products.length) return null;
    const res=await fetch("/api/catalog",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({products})
    });
    const data=await res.json();
    if(data?.ok&&Array.isArray(data.products)){
      setServerReady(true);
      return data.products as DbProduct[];
    }
    return null;
  }

  async function pullDatabase(){
    const res=await fetch("/api/catalog",{cache:"no-store"});
    const data=await res.json();
    if(data?.ok&&Array.isArray(data.products)){
      const local=dbToLocal(data.products as DbProduct[]);
      setCatalog(local.catalog);
      setResolved(local.resolved);
      setServerReady(true);
      return data.products as DbProduct[];
    }
    return null;
  }

  useEffect(()=>{
    let loadedCatalog=initialCatalog;
    let loadedResolved=initialResolved;
    try{
      const savedCatalog=window.localStorage.getItem(STORAGE_CATALOG_KEY);
      const savedResolved=window.localStorage.getItem(STORAGE_RESOLVED_KEY);

      if(savedCatalog){
        const parsed=JSON.parse(savedCatalog);
        if(Array.isArray(parsed)){
          loadedCatalog=parsed.map((item:CatalogIdentity,index:number)=>({
            ...item,
            sequence:typeof item?.sequence==="number"?item.sequence:index+1
          }));
          setCatalog(loadedCatalog);
        }
      }

      if(savedResolved){
        const parsed=JSON.parse(savedResolved);
        if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed)){
          loadedResolved=parsed;
          setResolved(parsed);
        }
      }
    }catch{
      setNotice("Data lokal sebelumnya tidak bisa dibaca. Mengambil katalog server.");
    }

    (async()=>{
      try{
        await pushDatabase(loadedCatalog,loadedResolved);
        await pullDatabase();
      }catch{
        setNotice("Koneksi database belum siap. Data lokal tetap dipertahankan.");
      }finally{
        setHydrated(true);
      }
    })();
  },[]);

  useEffect(()=>{
    if(!hydrated) return;
    window.localStorage.setItem(STORAGE_CATALOG_KEY,JSON.stringify(catalog));
    window.localStorage.setItem(STORAGE_RESOLVED_KEY,JSON.stringify(resolved));
  },[catalog,resolved,hydrated]);

  useEffect(()=>{
    if(!hydrated) return;

    const missing=catalog.filter(item=>{
      const key=item.affiliateUrl||"";
      const meta=resolved[key];
      return key&&(!meta||!meta.images||meta.images.length===0);
    });

    if(!missing.length) return;
    let cancelled=false;

    (async()=>{
      const patched={...resolved};
      let changed=false;

      for(const item of missing){
        const key=item.affiliateUrl||"";
        const meta=patched[key];
        const source=item.canonicalUrl||meta?.canonicalUrl||key;
        try{
          const res=await fetch("/api/resolve?url="+encodeURIComponent(source),{cache:"no-store"});
          const data:ResolvedProduct=await res.json();
          if(data?.images?.length){
            patched[key]={...meta,...data,inputUrl:key};
            changed=true;
          }
        }catch{}
      }

      if(!cancelled&&changed){
        setResolved(patched);
        await pushDatabase(catalog,patched);
        setNotice("Foto produk yang sebelumnya kosong berhasil diperbarui dan disinkronkan.");
      }
    })();

    return ()=>{cancelled=true};
  },[hydrated]);

  useEffect(()=>{
    if(!hydrated) return;

    try{
      if(window.localStorage.getItem(STORAGE_GALLERY_RESCAN_KEY)==="1") return;
    }catch{}

    let cancelled=false;

    (async()=>{
      const patched={...resolved};
      let changed=false;
      let upgraded=0;

      for(const item of catalog){
        const key=item.affiliateUrl||"";
        if(!key) continue;

        const current=patched[key];
        const source=item.canonicalUrl||current?.canonicalUrl||key;
        const currentCount=current?.images?.length||(current?.image?1:0);

        try{
          const res=await fetch(
            "/api/resolve?url="+encodeURIComponent(source)+"&refreshGallery="+Date.now(),
            {cache:"no-store"}
          );
          const data:ResolvedProduct=await res.json();
          const nextCount=data?.images?.length||0;

          // Never shrink an existing gallery. This migration only repairs
          // products where the improved resolver can prove that more media exists.
          if(data?.ok&&nextCount>currentCount){
            patched[key]={
              ...current,
              ...data,
              inputUrl:key,
              image:data.images?.[0]||data.image||current?.image||null,
              images:data.images
            };
            changed=true;
            upgraded++;
          }
        }catch{}
      }

      if(cancelled) return;

      if(changed){
        setResolved(patched);
        const synced=await pushDatabase(catalog,patched);
        if(synced){
          const local=dbToLocal(synced);
          setCatalog(local.catalog);
          setResolved(local.resolved);
        }
        setNotice(`Galeri produk diperiksa ulang · ${upgraded} produk mendapat foto tambahan.`);
      }

      try{
        window.localStorage.setItem(STORAGE_GALLERY_RESCAN_KEY,"1");
      }catch{}
    })();

    return ()=>{cancelled=true};
  },[hydrated]);

  const checks=useMemo(()=>{
    const lines=[...new Set(text.split(/\r?\n|\s+(?=https?:\/\/)/).map(x=>x.trim()).filter(Boolean))];
    const candidates:Array<ImportCandidate|{invalidUrl:string}>=lines.map(line=>{
      try{return parseBlibliImportUrl(line)}catch{return {invalidUrl:line}}
    });
    return checkImports(candidates,catalog);
  },[text,catalog]);

  const counts=checks.reduce((acc,row)=>{acc[row.status]=(acc[row.status]||0)+1;return acc},{} as Record<string,number>);

  async function analyzeLinks(){
    const ready=checks.filter(x=>x.status==="READY");
    if(!ready.length){
      setNotice(checks.some(x=>x.status==="DUPLICATE")?"Produk sudah ada di katalog. Tidak dibuat duplikat.":"Tidak ada link baru yang valid.");
      return;
    }

    setBusy(true);
    setNotice("");
    const next={...resolved};
    const newItems:CatalogIdentity[]=[];
    let nextSequence=Math.max(0,...catalog.map(item=>item.sequence||0))+1;

    for(const item of ready){
      try{
        const res=await fetch("/api/resolve?url="+encodeURIComponent(item.inputUrl),{cache:"no-store"});
        const data:ResolvedProduct=await res.json();
        next[item.inputUrl]=data;
        newItems.push({
          sequence:nextSequence++,
          affiliateUrl:item.inputUrl,
          canonicalProductId:data.canonicalProductId,
          canonicalUrl:data.canonicalUrl
        });
      }catch{
        next[item.inputUrl]={
          inputUrl:item.inputUrl,finalUrl:item.inputUrl,canonicalUrl:null,canonicalProductId:null,
          title:"Produk Blibli",image:null,images:[],price:null,currency:null,ok:false,
          message:"Link affiliate valid, tetapi metadata belum terbaca."
        };
        newItems.push({sequence:nextSequence++,affiliateUrl:item.inputUrl});
      }
    }

    const merged=[...catalog,...newItems];
    setResolved(next);
    setCatalog(merged);
    setText("");

    try{
      const products=await pushDatabase(merged,next);
      if(products){
        const local=dbToLocal(products);
        setCatalog(local.catalog);
        setResolved(local.resolved);
      }
      setNotice(`${newItems.length} produk baru berhasil di-import dan langsung disinkronkan ke Client.`);
    }catch{
      setNotice(`${newItems.length} produk masuk lokal, tetapi sinkron database gagal. Coba Refresh Data.`);
    }finally{
      setBusy(false);
    }
  }

  async function refreshProduct(url:string){
    if(refreshingUrl) return;

    const item=catalog.find(x=>x.affiliateUrl===url);
    const previous=resolved[url];
    const source=item?.canonicalUrl||previous?.canonicalUrl||url||"";

    setRefreshingUrl(url);
    setProductNotice(prev=>({...prev,[url]:"Mengambil ulang data produk..."}));

    try{
      const res=await fetch(
        "/api/resolve?url="+encodeURIComponent(source)+"&refresh="+Date.now(),
        {cache:"no-store"}
      );
      const data:ResolvedProduct=await res.json();

      if(!res.ok||!data?.ok){
        throw new Error(data?.message||"Resolver gagal");
      }

      const merged:ResolvedProduct={
        ...previous,
        ...data,
        inputUrl:url,
        title:data.title||previous?.title||"Produk Blibli",
        canonicalUrl:data.canonicalUrl||previous?.canonicalUrl||item?.canonicalUrl||null,
        canonicalProductId:data.canonicalProductId||previous?.canonicalProductId||item?.canonicalProductId||null,
        image:data.image||data.images?.[0]||previous?.image||previous?.images?.[0]||null,
        images:data.images?.length?data.images:(previous?.images||[])
      };

      const nextResolved={...resolved,[url]:merged};
      const nextCatalog=catalog.map(row=>
        row.affiliateUrl===url
          ? {
              ...row,
              canonicalProductId:merged.canonicalProductId||row.canonicalProductId,
              canonicalUrl:merged.canonicalUrl||row.canonicalUrl
            }
          : row
      );

      setResolved(nextResolved);
      setCatalog(nextCatalog);

      const synced=await pushDatabase(nextCatalog,nextResolved);
      if(!synced) throw new Error("Database sync gagal");

      const local=dbToLocal(synced);
      setCatalog(local.catalog);
      setResolved(local.resolved);

      const refreshed=local.resolved[url]||merged;
      setProductNotice(prev=>({
        ...prev,
        [url]:refreshed.images?.length
          ? `✓ Refresh selesai · ${refreshed.images.length} foto · sudah sync ke Client`
          : "✓ Refresh selesai · data sudah sync ke Client"
      }));
    }catch(error){
      setProductNotice(prev=>({
        ...prev,
        [url]:"Refresh gagal: "+(error instanceof Error?error.message:"coba lagi")
      }));
    }finally{
      setRefreshingUrl(null);
    }
  }

  async function removeLink(url:string){
    const item=catalog.find(x=>x.affiliateUrl===url);
    const id=item?.canonicalProductId||resolved[url]?.canonicalProductId;

    setCatalog(prev=>prev.filter(x=>x.affiliateUrl!==url));
    setResolved(prev=>{const n={...prev};delete n[url];return n});

    try{
      if(id){
        await fetch("/api/catalog?id="+encodeURIComponent(id),{method:"DELETE"});
      }
      setNotice("Produk dihapus dan langsung disinkronkan ke Client.");
    }catch{
      setNotice("Produk dihapus lokal, tetapi sinkron server gagal.");
    }
  }

  return <main className="shell">
    <aside>
      <div className="brand"><div className="mark">SF</div><div><strong>Skill Fusion</strong><small>ADMIN</small></div></div>
      <nav>
        <a className="active" href="#dashboard"><LayoutDashboard size={18}/>Dashboard</a>
        <a href="#import"><Link2 size={18}/>Import Affiliate</a>
        <a href="#products"><PackageSearch size={18}/>Products</a>
      </nav>
      <div className="secure"><ShieldCheck size={18}/><span>Admin dan Client memakai katalog database yang sama.</span></div>
    </aside>

    <section className="content">
      <header id="dashboard">
        <div><span className="eyebrow">CATALOG CONTROL CENTER</span><h1>Skill Fusion Admin</h1><p>Kelola produk Blibli yang benar-benar kamu masukkan. Tidak ada produk demo.</p></div>
        <div className="pill">ADMIN</div>
      </header>

      <div className="stats">
        <article><span>Produk tersimpan</span><strong>{catalog.length}</strong><small>produk katalog</small></article>
        <article><span>Link baru</span><strong>{counts.READY||0}</strong><small>siap di-import</small></article>
        <article><span>Duplicate</span><strong>{counts.DUPLICATE||0}</strong><small>otomatis diblokir</small></article>
        <article><span>Database Sync</span><strong>{serverReady?"SYNCED":"..."}</strong><small>{serverReady?"Admin ↔ Client":"menghubungkan..."}</small></article>
      </div>

      <section className="panel" id="import">
        <div className="panel-title"><div><span className="eyebrow">BLIBLI AFFILIATE</span><h2>Tambah produk dari link affiliate</h2><p>Produk yang berhasil di-import langsung disimpan ke database bersama dan muncul di Client.</p></div><CopyCheck size={24}/></div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={"Paste satu atau banyak link, satu link per baris\nhttps://s.blibli.com/GNtk/..."} />
        <div className="actions">
          <p><CheckCircle2 size={16}/> Sistem resolve shortlink, membaca Product ID, mengecek duplicate, lalu sinkron ke Client.</p>
          <button onClick={analyzeLinks} disabled={busy||!checks.length}>{busy?"Mengimpor...":"Import Produk"}</button>
        </div>
        {notice&&<div className="notice">{notice}</div>}
      </section>

      {!!checks.length&&<section className="panel">
        <div className="panel-title"><div><span className="eyebrow">PRE-FLIGHT</span><h2>Validasi sebelum import</h2></div></div>
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
        <div className="panel-title"><div><span className="eyebrow">PRODUCTS</span><h2>Katalog aktif</h2><p>Katalog ini adalah sumber yang sama dengan website Client.</p></div></div>
        <div className="product-admin-list">
          {catalog.map((item,i)=>{
            const url=item.affiliateUrl||"";
            const meta=resolved[url];
            return <article className="admin-product" key={url||i}>
              <div className="admin-thumb">{meta?.images?.[0]||meta?.image?<img src={meta?.images?.[0]||meta?.image||""} alt=""/>:<span>NO IMAGE</span>}</div>
              <div className="admin-product-body">
                <strong>#{String(item.sequence||i+1).padStart(3,"0")} {meta?.title||"Produk Blibli"}</strong>
                <small>{meta?.canonicalProductId||"Affiliate link aktif"}</small>
                {meta?.images?.length?<div className="admin-gallery">
                  {meta.images.map((src,j)=><img key={src} src={src} alt={`Foto produk ${j+1}`}/>)}
                </div>:null}
                {meta?.images?.length?<small>{meta.images.length} foto produk berhasil ditemukan</small>:<small>Foto belum terbaca — gunakan Refresh Data</small>}
                {meta?.price?<b>{meta.currency==="IDR"?"Rp ":""}{meta.price}</b>:<b>Harga mengikuti Blibli</b>}
                <div className="admin-product-actions">
                  <a href={url} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Buka Produk di Blibli</a>
                  <button
                    className={refreshingUrl===url?"refresh-btn refreshing":"refresh-btn"}
                    onClick={()=>refreshProduct(url)}
                    disabled={refreshingUrl!==null}
                  >
                    <RefreshCw size={15}/>
                    {refreshingUrl===url?"Refreshing...":"Refresh Data"}
                  </button>
                  <button onClick={()=>removeLink(url)} disabled={refreshingUrl===url}><Trash2 size={15}/>Hapus</button>
                </div>
                {productNotice[url]?<div className={productNotice[url].startsWith("Refresh gagal")?"product-refresh-status error":"product-refresh-status"}>{productNotice[url]}</div>:null}
              </div>
            </article>
          })}
        </div>
      </section>
    </section>
  </main>;
}
