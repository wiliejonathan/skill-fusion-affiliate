"use client";

import {useMemo,useState} from "react";
import {AlertTriangle,CheckCircle2,CopyCheck,LayoutDashboard,Link2,PackageSearch,ShieldCheck} from "lucide-react";
import {parseBlibliImportUrl,type ImportCandidate} from "@/lib/importer";
import {checkImports,type CatalogIdentity} from "@/lib/dedupe";

const initialCatalog:CatalogIdentity[]=[
  {
    canonicalProductId:"HOM-70013-01243-00006",
    canonicalUrl:"https://www.blibli.com/p/silicone-strap-tali-jam-silikon-rubber-for-xiaomi-redmi-smart-band-2-mi-band-8-active-silicon-karet-smartband/is--HOM-70013-01243-00006"
  }
];

export default function AdminPage(){
  const [text,setText]=useState("");
  const [catalog,setCatalog]=useState<CatalogIdentity[]>(initialCatalog);
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

  function addUnique(){
    const unique=checks.filter(x=>x.status==="UNIQUE");
    if(!unique.length){setNotice("Tidak ada produk baru yang bisa ditambahkan.");return}
    setCatalog(prev=>[
      ...prev,
      ...unique.map(x=>({
        canonicalProductId:x.canonicalProductId,
        canonicalUrl:x.canonicalUrl,
        affiliateUrl:x.affiliateUrl
      }))
    ]);
    setNotice(`${unique.length} produk baru masuk ke registry katalog. Duplicate tidak ditambahkan.`);
  }

  return <main className="shell">
    <aside>
      <div className="brand"><div className="mark">SF</div><div><strong>Skill Fusion</strong><small>ADMIN</small></div></div>
      <nav>
        <button className="active"><LayoutDashboard size={18}/>Dashboard</button>
        <button><Link2 size={18}/>Import Affiliate</button>
        <button><PackageSearch size={18}/>Products</button>
      </nav>
      <div className="secure"><ShieldCheck size={18}/><span>Website admin private dan terpisah dari website client.</span></div>
    </aside>

    <section className="content">
      <header>
        <div><span className="eyebrow">CATALOG CONTROL CENTER</span><h1>Affiliate Importer</h1><p>Paste satu atau banyak link Blibli. Duplicate akan terdeteksi sebelum produk dibuat.</p></div>
        <div className="pill">ADMIN</div>
      </header>

      <div className="stats">
        <article><span>Registry</span><strong>{catalog.length}</strong><small>identity tersimpan</small></article>
        <article><span>Produk baru</span><strong>{counts.UNIQUE||0}</strong><small>aman di-import</small></article>
        <article><span>Duplicate</span><strong>{counts.DUPLICATE||0}</strong><small>otomatis diblokir</small></article>
        <article><span>Need Resolve</span><strong>{counts.NEEDS_RESOLVE||0}</strong><small>shortlink belum punya ID</small></article>
      </div>

      <section className="panel">
        <div className="panel-title"><div><span className="eyebrow">BLIBLI AFFILIATE</span><h2>Bulk paste affiliate links</h2></div><CopyCheck size={24}/></div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={"Paste satu link per baris\nhttps://www.blibli.com/p/.../is--ABC-123...?utm_source=affiliates\nhttps://s.blibli.com/GNtk/..."} />
        <div className="actions">
          <p><AlertTriangle size={16}/> Product ID adalah kunci utama dedup. Shortlink identik tetap dideteksi, tetapi shortlink baru harus di-resolve agar bisa dibandingkan berdasarkan Product ID.</p>
          <button onClick={addUnique} disabled={!checks.some(x=>x.status==="UNIQUE")}>Import Produk Baru</button>
        </div>
        {notice&&<div className="notice">{notice}</div>}
      </section>

      {!!checks.length&&<section className="panel">
        <div className="panel-title"><div><span className="eyebrow">PRE-FLIGHT</span><h2>Duplicate detection</h2></div></div>
        <div className="table">
          <div className="row head"><span>Link / Product ID</span><span>Status</span><span>Alasan</span></div>
          {checks.map((row,i)=><div className="row" key={i}>
            <span className="url"><strong>{row.canonicalProductId||"Shortlink / unknown ID"}</strong><small>{row.inputUrl}</small></span>
            <span><b className={"status "+row.status.toLowerCase()}>{row.status}</b></span>
            <span className="reason">{row.reason}</span>
          </div>)}
        </div>
      </section>}

      <section className="logic">
        <CheckCircle2 size={20}/>
        <div><strong>Urutan dedup:</strong><span>Canonical Product ID → Canonical Product URL → Affiliate URL. Produk exact duplicate diblokir; link affiliate baru nantinya dapat dipakai untuk update record lama, bukan membuat produk kedua.</span></div>
      </section>
    </section>
  </main>;
}
