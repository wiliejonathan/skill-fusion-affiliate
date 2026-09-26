const SHEET_ID = '1V3LTciKM0AAXQAbdk-1eNk6Ie0aXL_ksvSDBzDVjUI0';
const DRAFT_SHEET = 'Draft';
const PUBLISHED_SHEET = 'Published';
const CONFIG_SHEET = 'Config';
const LOG_SHEET = 'Logs';
const HEADERS = ['sequence','id','canonicalProductId','name','brand','category','images_json','affiliateUrl','canonicalUrl','badge','features_json','price','currency','updatedAt','source'];

const PRODUCT_FETCH_UAS = [
  'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/143 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
];

const OFFICIAL_FALLBACK_PAGES = {
  'XIO-60022-01141-00001':'https://www.mi.co.id/id/product/xiaomi-6a-type-a-to-type-c-cable/',
  'ACO-60021-00234-00001':'https://acmic.id/products/acmic-pdc100-power-delivery-pd-100cm-cable-usb-type-c-to-usb-type-c'
};

const KNOWN_BLIBLI_GALLERIES = {
  'XIO-60022-01141-00001':[
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full02_cc3scl4a.jpeg',
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full03_hrw4dzk1.jpeg',
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full04_rw5y2lhf.jpeg',
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full05_q6u0ao56.jpeg'
  ],
  'ACO-60021-00234-00001':[
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full01_nhva0kf2.jpg',
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full01_gyux63fu.jpg',
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full02_tax0h4ac.jpg',
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full03_ulrs28kp.jpg',
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full04_vs6zuqs1.jpg',
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full05_qvrkqpgn.jpg',
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full06_q4432wpc.jpg',
    'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full07_ln9qkabt.jpg'
  ]
};

// Public reads only. Admin credentials and mutations are accepted exclusively in POST bodies.
function doGet(e){
  const p=(e&&e.parameter)||{};
  let out;
  try{
    const action=String(p.action||'catalog');
    if(action==='health') out={ok:true,service:'skill-fusion-apps-script',version:2,time:new Date().toISOString()};
    else if(action==='catalog') out={ok:true,products:readProducts_(PUBLISHED_SHEET)};
    else throw new Error('Operasi Admin wajib menggunakan POST');
  }catch(err){out={ok:false,message:String(err.message||err)}}
  return output_(out,p.callback);
}

function doPost(e){
  let lock;
  try{
    const p=JSON.parse(e&&e.postData&&e.postData.contents||'{}');
    requireAdmin_(p.key);
    const action=String(p.action||'');
    if(action==='draft')return output_({ok:true,products:readProducts_(DRAFT_SHEET)});
    if(action==='resolve')return output_(resolveProduct_(String(p.url||'')));
    if(['savePublish','reloadDom','reload','publish','publishAll','delete'].indexOf(action)<0)throw new Error('Action tidak dikenal');
    lock=LockService.getScriptLock();
    if(!lock.tryLock(30000))throw new Error('Database sedang diproses. Coba lagi.');
    let out;
    if(action==='savePublish')out=savePublish_(p);
    else if(action==='reloadDom')out=reloadDom_(String(p.url||''));
    else if(action==='reload')out=reloadOne_(String(p.id||''));
    else if(action==='publish')out=publishOne_(String(p.id||''));
    else if(action==='publishAll')out=publishAll_();
    else out=deleteOne_(String(p.id||''));
    SpreadsheetApp.flush();
    return output_(out);
  }catch(err){return output_({ok:false,code:err.code||'ERROR',message:String(err.message||err)})}
  finally{if(lock&&lock.hasLock())lock.releaseLock()}
}

function validBlibliUrl_(url){
  const value=String(url||'');
  if(!/^https:\/\/(?:www\.|s\.)?blibli\.com(?:[/?#]|$)/i.test(value))throw new Error('URL harus HTTPS Blibli');
  return value;
}
function resolvedShape_(p,input){return {ok:true,inputUrl:input,finalUrl:p.canonicalUrl,canonicalUrl:p.canonicalUrl,canonicalProductId:p.id,title:p.name,image:p.images[0]||null,images:p.images,price:p.price||null,currency:p.currency||null}}
function resolveProduct_(url){
  validBlibliUrl_(url);

  // Resolve identity first. Import must not fail merely because Blibli omits
  // gallery metadata from the server-side response.
  const resolved=resolveUrl_(url);
  const canonical=canonicalProductUrl_(resolved.canonical||resolved.finalUrl||url);
  const id=productId_(canonical)||productId_(resolved.finalUrl||'');

  if(!id)throw new Error('Shortlink Blibli belum berhasil di-resolve ke Product ID. Coba lagi beberapa detik.');

  const seed={
    id:id,
    canonicalProductId:id,
    name:titleFromUrl_(canonical),
    images:[],
    affiliateUrl:url,
    canonicalUrl:canonical,
    badge:'Blibli Affiliate',
    features:[],
    price:'',
    currency:''
  };

  const p=reloadFromBlibli_(seed);
  if(!isUsableProductTitle_(p.name))p.name=titleFromUrl_(canonical);

  // Product ID + canonical URL are enough to import. Gallery can be completed by
  // the same reload pipeline after import instead of blocking the whole product.
  return resolvedShape_(p,url);
}
function reloadDom_(url){
  validBlibliUrl_(url);
  const id=productId_(url);
  const current=readProducts_(DRAFT_SHEET).find(p=>p.id===id||p.affiliateUrl===url||p.canonicalUrl===url);
  if(!current)throw new Error('Produk tidak ditemukan di Draft');
  const next=reloadFromBlibli_(current);
  if(next.id!==current.id)throw new Error('Product ID berubah; data lama dipertahankan');
  upsert_(DRAFT_SHEET,next);
  log_('RELOAD',next.id,'OK',next.images.length+' foto');
  return resolvedShape_(next,url);
}
function validateProduct_(p){
  if(!p||typeof p!=='object'||!p.id||!String(p.name||'').trim())throw new Error('Data produk belum lengkap');
  const id=String(p.id);
  if(!/^[A-Za-z0-9-]{3,100}$/.test(id))throw new Error('Product ID tidak valid');
  validBlibliUrl_(p.affiliateUrl);
  if(p.canonicalUrl){validBlibliUrl_(p.canonicalUrl);if(productId_(p.canonicalUrl)!==id)throw new Error('Product ID tidak cocok dengan URL')}
  if(!Array.isArray(p.images)||p.images.some(x=>typeof x!=='string'||!/^https:\/\//i.test(x)))throw new Error('Foto produk tidak valid');
  return Object.assign({},p,{id:id,canonicalProductId:id,features:Array.isArray(p.features)?p.features.map(String):[],images:unique_(p.images),name:String(p.name).trim()});
}
function savePublish_(request){
  const input=request.product?[request.product]:request.products;
  if(!Array.isArray(input)||!input.length||input.length>500)throw new Error('Daftar produk kosong atau terlalu besar');
  // Validate the entire batch before writing; an invalid row must not partially publish.
  const all=input.map(validateProduct_);
  const existing=readProducts_(DRAFT_SHEET);
  const ids=new Set(),urls=new Set();
  let sequence=Math.max(0,...existing.map(p=>p.sequence));
  all.forEach(p=>{
    if(ids.has(p.id)||urls.has(p.affiliateUrl))throw new Error('Produk duplikat dalam batch');
    ids.add(p.id);urls.add(p.affiliateUrl);

    if(existing.some(x=>x.affiliateUrl===p.affiliateUrl&&x.id!==p.id)){
      const e=new Error('Link affiliate sudah dipakai produk lain');
      e.code='DUPLICATE';
      throw e;
    }

    const current=existing.find(x=>x.id===p.id);
    if(current&&current.affiliateUrl!==p.affiliateUrl){
      const e=new Error('Product ID sudah ada di katalog. Affiliate link baru tidak boleh menimpa produk yang sudah tersimpan.');
      e.code='DUPLICATE';
      throw e;
    }

    p.sequence=current?current.sequence:++sequence;
  });
  all.forEach(p=>{upsert_(DRAFT_SHEET,p);upsert_(PUBLISHED_SHEET,p)});
  log_('SAVE_PUBLISH','BATCH','OK',all.length+' produk');
  return {ok:true,products:readProducts_(DRAFT_SHEET),count:all.length};
}

function output_(obj,callback){
  const json=JSON.stringify(obj);
  const cb=String(callback||'');
  if(cb && /^[A-Za-z_$][A-Za-z0-9_.$]*$/.test(cb)){
    return ContentService.createTextOutput(cb+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function ss_(){return SpreadsheetApp.openById(SHEET_ID)}
function sheet_(name){const s=ss_().getSheetByName(name);if(!s)throw new Error('Sheet '+name+' tidak ditemukan');return s}
function config_(){
  const values=sheet_(CONFIG_SHEET).getDataRange().getValues(),map={};
  for(let i=1;i<values.length;i++){if(values[i][0])map[String(values[i][0])]=String(values[i][1]||'')}
  return map;
}
function requireAdmin_(key){const expected=config_().ADMIN_KEY;if(!expected||String(key||'')!==expected){const e=new Error('Admin key salah');e.code='UNAUTHORIZED';throw e}}
function log_(action,id,status,message){sheet_(LOG_SHEET).appendRow([new Date(),action,id||'',status,message||''])}

function rowToProduct_(r){
  let images=[],features=[];
  try{images=JSON.parse(r[6]||'[]')}catch(e){}
  try{features=JSON.parse(r[10]||'[]')}catch(e){}
  return {sequence:Number(r[0])||0,id:String(r[1]||''),canonicalProductId:String(r[2]||r[1]||''),name:String(r[3]||''),brand:String(r[4]||''),category:String(r[5]||''),images:Array.isArray(images)?images:[],affiliateUrl:String(r[7]||''),canonicalUrl:String(r[8]||''),badge:String(r[9]||'Blibli Affiliate'),features:Array.isArray(features)?features:[],price:String(r[11]||''),currency:String(r[12]||'')};
}
function safeCell_(value){return typeof value==='string'&&/^[=+@-]/.test(value)?"'"+value:value}
function productToRow_(p){return [p.sequence,p.id,p.canonicalProductId||p.id,p.name,p.brand,p.category,JSON.stringify(p.images||[]),p.affiliateUrl,p.canonicalUrl||'',p.badge||'Blibli Affiliate',JSON.stringify(p.features||[]),p.price||'',p.currency||'',new Date().toISOString(),p.source||'apps-script'].map(safeCell_)}
function readProducts_(name){const s=sheet_(name),v=s.getDataRange().getValues();if(v.length<2)return [];return v.slice(1).filter(r=>r[1]).map(rowToProduct_).sort((a,b)=>a.sequence-b.sequence)}
function findRow_(name,id){const s=sheet_(name);if(s.getLastRow()<2)return -1;const v=s.getRange(2,1,Math.max(1,s.getLastRow()-1),HEADERS.length).getValues();for(let i=0;i<v.length;i++)if(String(v[i][1])===id)return i+2;return -1}
function upsert_(name,p){const s=sheet_(name),row=findRow_(name,p.id),values=[productToRow_(p)];if(row>0)s.getRange(row,1,1,HEADERS.length).setValues(values);else s.getRange(s.getLastRow()+1,1,1,HEADERS.length).setValues(values)}
function deleteFrom_(name,id){const s=sheet_(name),row=findRow_(name,id);if(row>0)s.deleteRow(row)}

function reloadOne_(id){
  if(!id)throw new Error('Product ID wajib diisi');
  const current=readProducts_(DRAFT_SHEET).find(p=>p.id===id);
  if(!current)throw new Error('Produk tidak ditemukan di Draft');
  const next=reloadFromBlibli_(current);
  upsert_(DRAFT_SHEET,next);
  log_('RELOAD',id,'OK',next.images.length+' foto');
  return {ok:true,product:next,message:'Reload DOM selesai · '+next.images.length+' foto tersimpan di Draft'};
}
function reloadAll_(){
  const all=readProducts_(DRAFT_SHEET),errors=[],updated=[];
  all.forEach(p=>{try{const n=reloadFromBlibli_(p);upsert_(DRAFT_SHEET,n);updated.push(n)}catch(e){errors.push(p.id+': '+e.message)}});
  log_('RELOAD_ALL','ALL',errors.length?'PARTIAL':'OK',updated.length+' berhasil; '+errors.length+' gagal');
  return {ok:true,count:updated.length,errors,message:'Reload All selesai · '+updated.length+' berhasil'+(errors.length?', '+errors.length+' gagal':'')};
}
function publishOne_(id){
  const p=readProducts_(DRAFT_SHEET).find(x=>x.id===id);if(!p)throw new Error('Produk tidak ditemukan di Draft');
  upsert_(PUBLISHED_SHEET,p);log_('PUBLISH',id,'OK',p.images.length+' foto');
  return {ok:true,message:'Refresh Data selesai · Draft → Published/Client'};
}
function publishAll_(){
  const draft=readProducts_(DRAFT_SHEET),s=sheet_(PUBLISHED_SHEET);if(s.getLastRow()>1)s.getRange(2,1,s.getLastRow()-1,HEADERS.length).clearContent();
  if(draft.length)s.getRange(2,1,draft.length,HEADERS.length).setValues(draft.map(productToRow_));
  log_('PUBLISH_ALL','ALL','OK',draft.length+' produk');
  return {ok:true,count:draft.length,message:'Refresh Data All selesai · '+draft.length+' produk Published'};
}
function deleteOne_(id){if(!id)throw new Error('Product ID wajib diisi');deleteFrom_(DRAFT_SHEET,id);deleteFrom_(PUBLISHED_SHEET,id);log_('DELETE',id,'OK','Dihapus dari Draft & Published');return {ok:true,message:'Produk dihapus'}}

function reloadFromBlibli_(p){
  const start=validBlibliUrl_(p.canonicalUrl||p.affiliateUrl);
  const resolved=resolveUrl_(start);
  const canonical=(resolved.canonical||resolved.finalUrl||start).split('?')[0].replace(/\/$/,'');
  validBlibliUrl_(canonical);
  const id=productId_(canonical)||p.id;
  if(p.id&&id!==p.id)throw new Error('Product ID berubah; data lama dipertahankan');
  const html=fetchText_(canonical);
  let title=pick_(html,[/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,/<title[^>]*>([^<]+)<\/title>/i])||p.name;

  // Blibli's visible gallery is rendered as heroThumbnails. Read that exact DOM
  // structure first, then merge other Blibli HTML/JSON sources.
  const heroImages=extractHeroThumbnails_(html);
  const htmlImages=extractBlibliGallery_(html,canonical);
  let gathered=heroImages.concat(htmlImages);

  const summary=summaryData_(canonical,id);
  if(isUsableProductTitle_(summary.title))title=summary.title;
  gathered=gathered.concat(summary.images);

  const gallery=dominantBlibliGallery_(rankProductImages_(gathered,id)).slice(0,40);
  let finalGallery=gallery.length?gallery:(p.images||[]);

  // Exact DOM galleries supplied by Blibli for the current products. These are
  // only used when the server-side response is sparse, so future complete DOM
  // galleries still win automatically.
  const known=KNOWN_BLIBLI_GALLERIES[id]||[];
  if(known.length>finalGallery.length)finalGallery=known.slice();

  // Manufacturer page remains a final fallback only.
  if(finalGallery.length<4){
    const official=officialFallbackImages_(id);
    if(official.length>finalGallery.length)finalGallery=official;
  }
  const price=pick_(html,[/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,/"price"\s*:\s*"?([0-9.]+)"?/i])||p.price||'';
  const currency=pick_(html,[/<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,/"priceCurrency"\s*:\s*"([^"]+)"/i])||p.currency||'';
  if(!isUsableProductTitle_(title))title=p.name;
  return Object.assign({},p,{id:id,canonicalProductId:id,name:title,brand:inferBrand_(title,id),features:inferFeatures_(title),canonicalUrl:canonical,images:finalGallery,price:price,currency:currency,source:'blibli-reload'});
}
function resolveUrl_(url){
  let current=url,html='';

  for(let i=0;i<8;i++){
    validBlibliUrl_(current);
    let response=null;

    for(let u=0;u<PRODUCT_FETCH_UAS.length;u++){
      try{
        const candidate=UrlFetchApp.fetch(current,{
          followRedirects:false,
          muteHttpExceptions:true,
          headers:{
            Accept:'text/html,application/xhtml+xml',
            'Accept-Language':'id-ID,id;q=0.9,en;q=0.8',
            'Cache-Control':'no-cache',
            Pragma:'no-cache',
            'User-Agent':PRODUCT_FETCH_UAS[u]
          }
        });
        const candidateCode=candidate.getResponseCode();
        if(candidateCode>=200&&candidateCode<400){
          response=candidate;
          break;
        }
      }catch(e){}
    }

    if(!response)break;

    const code=response.getResponseCode(),h=response.getAllHeaders(),loc=h.Location||h.location;
    if(code>=300&&code<400&&loc){
      const next=absoluteUrl_(current,String(loc));
      // Blibli shortlinks normally land on www.blibli.com. If an intermediate
      // redirect is external, let fetchText_ follow it and recover canonical URL.
      if(/^https:\/\/(?:www\.|s\.)?blibli\.com(?:[/?#]|$)/i.test(next)){
        current=next;
        continue;
      }
      break;
    }

    html=response.getContentText();
    break;
  }

  let canonical=pick_(html,[
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i
  ]);

  // Fallback: fetch with redirects enabled. This recovers the final product page
  // even when s.blibli.com changes its redirect chain.
  if(!productId_(canonical||'')&&!productId_(current)){
    const followed=fetchText_(url);
    const followedCanonical=pick_(followed,[
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i
    ]);
    if(followedCanonical){
      canonical=followedCanonical;
      current=followedCanonical;
    }else{
      const embedded=String(followed||'').match(/https:\/\/(?:www\.)?blibli\.com\/p\/[^"'\\\s<>]+\/is--[A-Za-z0-9-]+/i);
      if(embedded&&embedded[0]){
        canonical=embedded[0];
        current=embedded[0];
      }
    }
  }

  const candidate=productId_(canonical||'')?canonical:current;
  return {finalUrl:current,canonical:canonicalProductUrl_(candidate||url)};
}
function absoluteUrl_(base,loc){
  if(/^https?:\/\//i.test(loc))return loc;
  if(/^\/\//.test(loc))return 'https:'+loc;
  const m=String(base).match(/^(https?:\/\/[^/]+)(\/.*)?$/i);
  if(!m)return loc;
  if(loc.charAt(0)==='/')return m[1]+loc;
  const path=(m[2]||'/').split('?')[0].replace(/[^/]*$/,'');
  return m[1]+path+loc;
}
function fetchText_(url){
  for(let i=0;i<PRODUCT_FETCH_UAS.length;i++){
    try{
      const r=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true,headers:{
        Accept:'text/html,application/xhtml+xml',
        'Accept-Language':'id-ID,id;q=0.9,en;q=0.8',
        'Cache-Control':'no-cache',
        Pragma:'no-cache',
        'User-Agent':PRODUCT_FETCH_UAS[i]
      }});
      if(r.getResponseCode()>=200&&r.getResponseCode()<400){
        const body=r.getContentText();
        if(body)return body;
      }
    }catch(e){}
  }
  return '';
}
function fetchJson_(url,referer){
  for(let i=0;i<PRODUCT_FETCH_UAS.length;i++){
    try{
      const r=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true,headers:{
        Accept:'application/json,text/plain,*/*',
        'Accept-Language':'id-ID,id;q=0.9,en;q=0.8',
        'Cache-Control':'no-cache',
        Pragma:'no-cache',
        Referer:referer||'',
        'User-Agent':PRODUCT_FETCH_UAS[i]
      }});
      if(r.getResponseCode()<200||r.getResponseCode()>=300)continue;
      const body=r.getContentText();
      if(body)return JSON.parse(body);
    }catch(e){}
  }
  return null;
}
function summaryData_(canonical,id){
  const endpoints=['https://www.blibli.com/backend/product-detail/products/is--'+encodeURIComponent(id)+'/_summary'];
  const productSku=id.replace(/-\d{5}$/,'');
  if(productSku!==id)endpoints.push('https://www.blibli.com/backend/product-detail/products/ps--'+encodeURIComponent(productSku)+'/_summary?defaultItemSku='+encodeURIComponent(id)+'&cnc=false');

  let title='',images=[];
  endpoints.forEach(function(u){
    const j=fetchJson_(u,canonical);
    if(!j)return;
    const data=j.data||j;
    if(data&&data.name)title=String(data.name);

    const productCode=data&&typeof data.productCode==='string'?String(data.productCode):'';
    let current=collectSummaryImages_(data,canonical);

    if(/^MTA-\d+$/i.test(productCode)){
      const exact=current.filter(function(src){
        return src.toUpperCase().indexOf(productCode.toUpperCase())>=0;
      });
      if(exact.length)current=exact;
    }
    images=images.concat(current);
  });

  const ranked=rankProductImages_(images,id);
  return {title:title,images:dominantBlibliGallery_(ranked)};
}
function decodeHtml_(s){return String(s||'').replace(/&amp;/g,'&').replace(/&#x2F;|&#47;/ig,'/').replace(/&quot;/g,'"').replace(/\\u002F/ig,'/').replace(/\\u003A/ig,':').replace(/\\u0026/ig,'&').replace(/\\u003D/ig,'=').replace(/\\\//g,'/')}
function normalizeImage_(s){
  if(!s)return '';
  let v=decodeHtml_(s).trim().replace(/^["']|["']$/g,'');
  if(/^\/\//.test(v))v='https:'+v;
  else if(/^(?:www\.)?static-src\.com\//i.test(v))v='https://'+v;
  v=v.replace(/^http:\/\//i,'https://');
  v=v.replace('/images/catalog/thumbnail/','/images/catalog/full/').replace('/images/catalog/square/','/images/catalog/full/');
  v=v.split('#')[0];

  // heroThumbnails uses ?w=112. Once promoted to /full/, drop transform params
  // so Admin and Client receive the original full-resolution product image.
  try{
    const u=new URL(v);
    ['w','h','width','height','quality','q','resize','format'].forEach(function(key){u.searchParams.delete(key)});
    v=u.toString();
  }catch(e){}

  return /^https:\/\//i.test(v)?v:'';
}
function imageKey_(url){
  const v=normalizeImage_(url);if(!v)return '';
  return v.toLowerCase().replace(/^https:\/\/[^/]+/,'').replace(/([?&])(width|height|w|h|quality|q|resize|format)=[^&]*/ig,'$1').replace(/[?&]+$/,'');
}
function imageLooksUseful_(url){
  const v=String(url||'').toLowerCase();
  if(!/^https:\/\//.test(v))return false;
  if(/(?:logo|icon|sprite|avatar|badge|payment|promo-banner|placeholder|favicon|tracking|pixel|1x1)/.test(v))return false;
  return /\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(v)||/(?:static-src\.com|blibli\.com|cdn|image|img|catalog|product)/i.test(v);
}
function extractProductImages_(text,baseUrl){
  const n=decodeHtml_(text),out=[];
  function add(v){
    if(!v)return;
    String(v).split(',').forEach(function(part){
      let x=part.trim().split(/\s+/)[0];
      if(/^\/(?!\/)/.test(x)){
        const m=String(baseUrl||'').match(/^(https?:\/\/[^/]+)/i);if(m)x=m[1]+x;
      }
      x=normalizeImage_(x);if(x&&imageLooksUseful_(x))out.push(x);
    });
  }
  let m;
  const attrs=/(?:src|data-src|data-original|data-lazy-src|data-zoom-image|content|href)\s*=\s*["']([^"']+)["']/ig;
  while((m=attrs.exec(n)))add(m[1]);
  const srcsets=/(?:srcset|data-srcset)\s*=\s*["']([^"']+)["']/ig;
  while((m=srcsets.exec(n)))add(m[1]);

  const absolute=n.match(/https?:\/\/[^"'\\\s<>]+/ig)||[];
  const protocolRelative=n.match(/\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\/[^"'\\\s<>]+/ig)||[];
  const schemeLess=n.match(/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\/[^"'\\\s<>]+/ig)||[];
  absolute.concat(protocolRelative,schemeLess).forEach(add);
  return rankProductImages_(out,'');
}
function isUsableProductTitle_(title){
  const v=String(title||'').trim();
  return !!v && !/online mall blibli|belanja online aman|blibli\.com/i.test(v) && v.length>5;
}
function extractBlibliGallery_(text,baseUrl){
  return extractProductImages_(text,baseUrl).filter(function(url){
    return /^https:\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\//i.test(url);
  });
}
function extractHeroThumbnails_(html){
  const n=decodeHtml_(html),out=[];
  const blocks=n.match(/<div[^>]+data-testid=["']heroThumbnails-\d+["'][\s\S]*?<\/div>/ig)||[];

  blocks.forEach(function(block){
    // Prefer data-src because it is Blibli's original gallery URL; src often has
    // the same path plus a small-width transform such as ?w=112.
    let m=block.match(/data-src=["']([^"']+)["']/i);
    if(!m)m=block.match(/\ssrc=["']([^"']+)["']/i);
    if(!m||!m[1])return;
    const src=normalizeImage_(m[1]);
    if(/^https:\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\//i.test(src) && out.indexOf(src)<0){
      out.push(src);
    }
  });

  return out;
}

function collectSummaryImages_(value,baseUrl){
  const found=[];
  function add(raw){
    const src=normalizeImage_(raw);
    if(!src)return;
    if(!/^https:\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\//i.test(src))return;
    if(found.indexOf(src)<0)found.push(src);
  }
  function visit(node,keyHint){
    if(typeof node==='string'){
      if(/image|gallery|media|photo|picture|src|url/i.test(String(keyHint||'')) ||
         /static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\//i.test(node)) add(node);
      return;
    }
    if(Array.isArray(node)){
      node.forEach(function(item){visit(item,keyHint)});
      return;
    }
    if(!node||typeof node!=='object')return;
    Object.keys(node).forEach(function(key){
      const child=node[key];
      const nextHint=/image|gallery|media|photo|picture|src|url/i.test(key)?key:keyHint;
      visit(child,nextHint);
    });
  }
  visit(value,'');
  const serialized=extractBlibliGallery_(JSON.stringify(value),baseUrl);
  serialized.forEach(function(src){if(found.indexOf(src)<0)found.push(src)});
  return found;
}

function dominantBlibliGallery_(images){
  if(!images||!images.length)return [];
  const groups={};
  images.forEach(function(src){
    const m=String(src).match(/MTA-\d+/i);
    if(!m)return;
    const key=m[0].toUpperCase();
    if(!groups[key])groups[key]=[];
    if(groups[key].indexOf(src)<0)groups[key].push(src);
  });
  const keys=Object.keys(groups);
  if(!keys.length)return images;
  keys.sort(function(a,b){return groups[b].length-groups[a].length});
  return groups[keys[0]].length?groups[keys[0]]:images;
}
function rankProductImages_(images,id){
  const seen={},rows=[];
  (images||[]).forEach((raw,index)=>{
    const url=normalizeImage_(raw),key=imageKey_(url);
    if(!url||!key||seen[key]||!imageLooksUseful_(url))return;
    seen[key]=true;
    let score=0;
    const low=url.toLowerCase();
    if(/static-src\.com\/wcsstore\/indraprastha\/images\/catalog\/full\//i.test(low))score+=120;
    else if(/static-src\.com\/wcsstore\/indraprastha\/images\/catalog\//i.test(low))score+=100;
    if(/(?:catalog|product|products|pdp)/i.test(low))score+=45;
    if(/(?:full|large|zoom|original|master|1080|1000x)/i.test(low))score+=25;
    if(id&&low.indexOf(String(id).toLowerCase())>=0)score+=80;
    if(/(?:thumbnail|thumb|small|icon|logo|banner|avatar)/i.test(low))score-=60;
    rows.push({url:url,score:score,index:index});
  });
  rows.sort((a,b)=>b.score-a.score||a.index-b.index);
  return rows.map(x=>x.url);
}
function officialFallbackImages_(id){
  const page=OFFICIAL_FALLBACK_PAGES[id];
  if(!page)return [];
  const html=fetchText_(page);
  if(!html)return [];
  const n=decodeHtml_(html),out=[];
  const patterns=[
    /https:\/\/(?:www\.)?acmic\.id\/cdn\/shop\/files\/[^"'\\\s<>]+/ig,
    /https:\/\/cdn\.shopify\.com\/s\/files\/[^"'\\\s<>]+/ig,
    /https:\/\/i02\.appmifile\.com\/[^"'\\\s<>]+/ig
  ];
  patterns.forEach(regex=>(n.match(regex)||[]).forEach(url=>out.push(url)));
  return rankProductImages_(out,id).slice(0,20);
}

function canonicalProductUrl_(value){
  try{
    const u=new URL(String(value||''));
    return (u.origin+u.pathname).replace(/\/$/,'');
  }catch(e){
    return String(value||'').split('?')[0].replace(/\/$/,'');
  }
}
function titleFromUrl_(value){
  try{
    const u=new URL(String(value||''));
    const marker='/is--';
    const i=u.pathname.indexOf(marker);
    const before=i>=0?u.pathname.slice(0,i):u.pathname;
    const slug=before.split('/').filter(Boolean).pop()||'Produk Blibli';
    return slug.split('-').filter(Boolean).map(function(part,index){
      if(/^\d/.test(part)||/^[a-z]+\d+$/i.test(part))return part.toUpperCase();
      return index===0?part.toUpperCase():part;
    }).join(' ');
  }catch(e){
    return 'Produk Blibli';
  }
}
function productId_(url){const m=String(url||'').match(/\/is--([^/?#]+)/i);return m?m[1]:''}
function pick_(text,patterns){for(let i=0;i<patterns.length;i++){const m=String(text||'').match(patterns[i]);if(m&&m[1])return String(m[1]).replace(/&amp;/g,'&').trim()}return ''}
function unique_(arr){return Array.from(new Set((arr||[]).filter(Boolean)))}
function inferBrand_(title,id){const u=String(title||'').toUpperCase();if(u.indexOf('XIAOMI')===0||String(id).indexOf('XIO-')===0)return 'XIAOMI';if(u.indexOf('ACMIC')===0||String(id).indexOf('ACO-')===0)return 'ACMIC';return String(title||'TECH').split(/\s+/)[0].toUpperCase()}
function inferFeatures_(title){const v=String(title||'').toLowerCase(),f=[];if(/100\s*cm/.test(v))f.push('100 cm');if(/type\s*-?\s*c|usb\s*c/.test(v))f.push('USB Type-C');if(/power delivery|\bpd\b/.test(v))f.push('Power Delivery');else if(/fast\s*charging|6a/.test(v))f.push('Fast charging');return f.length?f:['Blibli Affiliate']}
