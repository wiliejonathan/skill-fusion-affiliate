"use client";

import {useMemo,useState} from "react";
import {CheckCircle2,CopyCheck,ExternalLink,LayoutDashboard,Link2,PackageSearch,ShieldCheck,Trash2} from "lucide-react";
import {parseBlibliImportUrl,type ImportCandidate} from "@/lib/importer";
import {checkImports,type CatalogIdentity} from "@/lib/dedupe";

type ResolvedProduct={
  inputUrl:string; finalUrl:string; canonicalUrl:string|null; canonicalProductId:string|null;
  title:string|null; image:string|null; images:string[]; price:string|null; currency:string|null; ok:boolean; message?:string;
};

const FIRST_LINK="https://s.blibli.com/GNtk/0qrtsw3f";
const FIRST_FINAL="https://www.blibli.com/p/acmic-braided-line-kabel-data-charger-100cm-fast-charging-cable-gc100-gl100-gm100/is--ACO-60021-00244-00014?pickupPointCode=PP-3538803&share_link=1&utm_campaign=affiliate_share&utm_content=salin_link&utm_medium=aff_6ab567e244d6d2a8c322863d&utm_source=affiliates";
const FIRST_CANONICAL="https://www.blibli.com/p/acmic-braided-line-kabel-data-charger-100cm-fast-charging-cable-gc100-gl100-gm100/is--ACO-60021-00244-00014";
const FIRST_TITLE="ACMIC Braided Line Kabel Data Charger 100cm Fast Charging Cable GC100 / GL100 / GM100";

const initialCatalog:CatalogIdentity[]=[{
  affiliateUrl:FIRST_LINK,
  canonicalProductId:"ACO-60021-00244-00014",
  canonicalUrl:FIRST_CANONICAL
}];

const initialResolved:Record<string,ResolvedProduct>={
  [FIRST_LINK]:{
    inputUrl:FIRST_LINK,finalUrl:FIRST_FINAL,canonicalUrl:FIRST_CANONICAL,
    canonicalProductId:"ACO-60021-00244-00014",title:FIRST_TITLE,
    image:"https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full45_njeqi5ul.jpg",images:["https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full45_njeqi5ul.jpg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full15_ph0p14k5.jpg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full16_mwsi08wd.jpg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full17_fecq856n.jpg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full18_gr5fkrpk.jpg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full44_k26116c9.jpg"],price:null,currency:null,ok:true
  }
};

export default function AdminPage(){
  const [text,setText]=useState("");
  const [catalog,setCatalog]=useState<CatalogIdentity[]>(initialCatalog);
  const [resolved,setResolved]=useState<Record<string,ResolvedProduct>>(initialResolved);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");

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
    setBusy(true); setNotice("");
    const next={...resolved};
    const newItems:CatalogIdentity[]=[];
    for(const item of ready){
      try{
        const res=await fetch("/api/resolve?url="+encodeURIComponent(item.inputUrl),{cache:"no-store"});
        const data:ResolvedProduct=await res.json();
        next[item.inputUrl]=data;
        newItems.push({
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
        newItems.push({affiliateUrl:item.inputUrl});
      }
    }
    setResolved(next);
    setCatalog(prev=>[...prev,...newItems]);
    setText("");
    setBusy(false);
    setNotice(`${newItems.length} produk baru berhasil dimasukkan. Duplicate tidak ditambahkan.`);
  }

  function removeLink(url:string){
    setCatalog(prev=>prev.filter(x=>x.affiliateUrl!==url));
    setResolved(prev=>{const n={...prev};delete n[url];return n});
    setNotice("Produk dihapus dari tampilan admin.");
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
        <div><span className="eyebrow">CATALOG CONTROL CENTER</span><h1>Skill Fusion Admin</h1><p>Kelola produk Blibli yang benar-benar kamu masukkan. Tidak ada produk demo.</p></div>
        <div className="pill">ADMIN</div>
      </header>

      <div className="stats">
        <article><span>Produk tersimpan</span><strong>{catalog.length}</strong><small>produk katalog</small></article>
        <article><span>Link baru</span><strong>{counts.READY||0}</strong><small>siap di-import</small></article>
        <article><span>Duplicate</span><strong>{counts.DUPLICATE||0}</strong><small>otomatis diblokir</small></article>
        <article><span>Status client</span><strong>LIVE</strong><small>{catalog.length} produk aktif</small></article>
      </div>

      <section className="panel" id="import">
        <div className="panel-title"><div><span className="eyebrow">BLIBLI AFFILIATE</span><h2>Tambah produk dari link affiliate</h2><p>Paste link baru di sini. Shortlink Blibli langsung diproses otomatis; detail teknis resolver disembunyikan dari dashboard.</p></div><CopyCheck size={24}/></div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={"Paste satu atau banyak link, satu link per baris\nhttps://s.blibli.com/GNtk/..."} />
        <div className="actions">
          <p><CheckCircle2 size={16}/> Sistem akan resolve shortlink, membaca Product ID, lalu mengecek duplicate sebelum menyimpan.</p>
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
        <div className="panel-title"><div><span className="eyebrow">PRODUCTS</span><h2>Katalog aktif</h2><p>Saat ini hanya ada produk yang kamu berikan sendiri.</p></div></div>
        <div className="product-admin-list">
          {catalog.map((item,i)=>{
            const url=item.affiliateUrl||"";
            const meta=resolved[url];
            return <article className="admin-product" key={url||i}>
              <div className="admin-thumb">{meta?.images?.[0]||meta?.image?<img src={meta?.images?.[0]||meta?.image||""} alt=""/>:<span>ACMIC</span>}</div>
              <div className="admin-product-body">
                <strong>{meta?.title||"Produk Blibli"}</strong>
                <small>{meta?.canonicalProductId||"Affiliate link aktif"}</small>
                {meta?.images?.length?<div className="admin-gallery">
                  {meta.images.map((src,j)=><img key={src} src={src} alt={`Foto produk ${j+1}`}/>)}
                </div>:null}
                {meta?.images?.length?<small>{meta.images.length} foto produk dari gallery Blibli</small>:null}
                {meta?.price?<b>{meta.currency==="IDR"?"Rp ":""}{meta.price}</b>:<b>Harga mengikuti Blibli</b>}
                <div className="admin-product-actions">
                  <a href={url} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Buka Produk di Blibli</a>
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
