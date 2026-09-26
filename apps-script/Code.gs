const SHEET_ID = '1V3LTciKM0AAXQAbdk-1eNk6Ie0aXL_ksvSDBzDVjUI0';
const DRAFT_SHEET = 'Draft';
const PUBLISHED_SHEET = 'Published';
const CONFIG_SHEET = 'Config';
const LOG_SHEET = 'Logs';
const HEADERS = ['sequence','id','canonicalProductId','name','brand','category','images_json','affiliateUrl','canonicalUrl','badge','features_json','price','currency','updatedAt','source','description','priceUpdatedAt'];

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
    ensureSchema_();
    if(action==='health') out={ok:true,service:'skill-fusion-apps-script',version:3,time:new Date().toISOString()};
    else if(action==='catalog') out={ok:true,products:readProducts_(PUBLISHED_SHEET)};
    else if(action==='price') out=publicPrice_(String(p.id||''));
    else throw new Error('Operasi Admin wajib menggunakan POST');
  }catch(err){out={ok:false,message:String(err.message||err)}}
  return output_(out,p.callback);
}

function doPost(e){
  let lock;
  try{
    const p=JSON.parse(e&&e.postData&&e.postData.contents||'{}');
    requireAdmin_(p.key);
    ensureSchema_();
    try{ensurePriceRefreshTrigger_()}catch(triggerError){}
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
function resolvedShape_(p,input){return {ok:true,inputUrl:input,finalUrl:p.canonicalUrl,canonicalUrl:p.canonicalUrl,canonicalProductId:p.id,title:p.name,image:p.images[0]||null,images:p.images,price:p.price||null,currency:p.currency||null,description:p.description||null}}
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
    currency:'',
    description:''
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
  return Object.assign({},p,{id:id,canonicalProductId:id,features:Array.isArray(p.features)?p.features.map(String):[],images:unique_(p.images),name:String(p.name).trim(),description:cleanDescription_(p.description||'')});
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

    // A sparse resolver/reload must never erase an already healthy gallery.
    if(current&&(!p.images||!p.images.length)&&current.images&&current.images.length){
      p.images=current.images.slice();
    }
    if(current&&!normalizePrice_(p.price)&&normalizePrice_(current.price)){
      p.price=current.price;
      p.currency=current.currency||p.currency||'IDR';
      p.priceUpdatedAt=current.priceUpdatedAt||p.priceUpdatedAt||'';
    }else if(current&&!p.priceUpdatedAt&&current.priceUpdatedAt){
      p.priceUpdatedAt=current.priceUpdatedAt;
    }
    if(current&&!cleanDescription_(p.description||'')&&cleanDescription_(current.description||'')){
      p.description=current.description;
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
function ensureSchema_(){
  [DRAFT_SHEET,PUBLISHED_SHEET].forEach(function(name){
    const s=sheet_(name);
    if(typeof s.getMaxColumns==='function'&&typeof s.insertColumnsAfter==='function'){
      const max=s.getMaxColumns();
      if(max<HEADERS.length)s.insertColumnsAfter(max,HEADERS.length-max);
    }
    const current=s.getRange(1,1,1,HEADERS.length).getValues()[0];
    let different=false;
    for(let i=0;i<HEADERS.length;i++){
      if(String(current[i]||'')!==HEADERS[i]){different=true;break}
    }
    if(different)s.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
  });
}
function priceIsFresh_(p,maxAgeMs){
  if(!p||!normalizePrice_(p.price)||!p.priceUpdatedAt)return false;
  const ts=Date.parse(String(p.priceUpdatedAt));
  return isFinite(ts)&&(Date.now()-ts)<maxAgeMs;
}
function ensurePriceRefreshTrigger_(){
  const handler='scheduledRefreshPrices';
  const exists=ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()===handler});
  if(!exists)ScriptApp.newTrigger(handler).timeBased().everyMinutes(10).create();
}
function setupPriceRefreshTrigger(){
  ensureSchema_();
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='scheduledRefreshPrices')ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('scheduledRefreshPrices').timeBased().everyMinutes(10).create();
  scheduledRefreshPrices();
}
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
  return {sequence:Number(r[0])||0,id:String(r[1]||''),canonicalProductId:String(r[2]||r[1]||''),name:String(r[3]||''),brand:String(r[4]||''),category:String(r[5]||''),images:Array.isArray(images)?images:[],affiliateUrl:String(r[7]||''),canonicalUrl:String(r[8]||''),badge:String(r[9]||'Blibli Affiliate'),features:Array.isArray(features)?features:[],price:String(r[11]||''),currency:String(r[12]||''),description:String(r[15]||''),priceUpdatedAt:String(r[16]||'')};
}
function safeCell_(value){return typeof value==='string'&&/^[=+@-]/.test(value)?"'"+value:value}
function productToRow_(p){return [p.sequence,p.id,p.canonicalProductId||p.id,p.name,p.brand,p.category,JSON.stringify(p.images||[]),p.affiliateUrl,p.canonicalUrl||'',p.badge||'Blibli Affiliate',JSON.stringify(p.features||[]),p.price||'',p.currency||'',new Date().toISOString(),p.source||'apps-script',p.description||'',p.priceUpdatedAt||''].map(safeCell_)}
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
  // Resolve affiliate URL first. The final Blibli URL can contain pickupPointCode
  // and selected-item context that Blibli needs before returning the actual price.
  const start=validBlibliUrl_(p.affiliateUrl||p.canonicalUrl);
  const resolved=resolveUrl_(start);
  const canonical=(resolved.canonical||resolved.finalUrl||start).split('?')[0].replace(/\/$/,'');
  validBlibliUrl_(canonical);
  const id=productId_(canonical)||p.id;
  if(p.id&&id!==p.id)throw new Error('Product ID berubah; data lama dipertahankan');

  const pricingUrl=productId_(resolved.finalUrl||'')?(resolved.finalUrl||canonical):canonical;
  const html=fetchText_(pricingUrl);
  let title=pick_(html,[/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,/<title[^>]*>([^<]+)<\/title>/i])||p.name;

  // Blibli's visible gallery is rendered as heroThumbnails. Read that exact DOM
  // structure first, then merge other Blibli HTML/JSON sources.
  const heroImages=extractHeroThumbnails_(html);
  const htmlImages=extractBlibliGallery_(html,canonical);
  let gathered=heroImages.concat(htmlImages);

  const summary=summaryData_(canonical,id,pricingUrl);
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
  const htmlPrice=extractHtmlPrice_(html);
  const htmlCurrency=pick_(html,[/<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,/"priceCurrency"\s*:\s*"([^"]+)"/i]);
  const searchPrice=(!summary.price&&!htmlPrice)?searchPriceData_(id,title,canonical):{price:'',currency:''};
  const freshPrice=normalizePrice_(summary.price||htmlPrice||searchPrice.price||'');
  const price=normalizePrice_(freshPrice||p.price||'');
  const currency=(summary.currency||htmlCurrency||searchPrice.currency||p.currency||(price?'IDR':'')).toUpperCase();
  const priceUpdatedAt=freshPrice?new Date().toISOString():(p.priceUpdatedAt||'');
  const htmlDescription=pick_(html,[
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
  ]);
  const description=cleanDescription_(summary.description||htmlDescription||p.description||'');
  if(!isUsableProductTitle_(title))title=p.name;
  return Object.assign({},p,{id:id,canonicalProductId:id,name:title,brand:inferBrand_(title,id),features:inferFeatures_(title),canonicalUrl:canonical,images:finalGallery,price:price,currency:currency,description:description,priceUpdatedAt:priceUpdatedAt,source:'blibli-reload'});
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
function summaryData_(canonical,id,contextUrl){
  let pickupPointCode='';
  try{
    pickupPointCode=new URL(String(contextUrl||canonical)).searchParams.get('pickupPointCode')||'';
  }catch(e){}

  const itemSuffix=pickupPointCode?'?pickupPointCode='+encodeURIComponent(pickupPointCode):'';
  const endpoints=['https://www.blibli.com/backend/product-detail/products/is--'+encodeURIComponent(id)+'/_summary'+itemSuffix];

  const productSku=id.replace(/-\d{5}$/,'');
  if(productSku!==id){
    let productUrl='https://www.blibli.com/backend/product-detail/products/ps--'+encodeURIComponent(productSku)+'/_summary?defaultItemSku='+encodeURIComponent(id)+'&cnc=false';
    if(pickupPointCode)productUrl+='&pickupPointCode='+encodeURIComponent(pickupPointCode);
    endpoints.push(productUrl);
  }

  let title='',images=[],price='',currency='',description='';
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

    let priceData=extractSummaryPrice_(data);
    if(!priceData.price)priceData=extractSerializedPrice_(JSON.stringify(data));
    if(priceData.price){
      price=priceData.price;
      currency=priceData.currency||currency||'IDR';
    }

    const currentDescription=extractSummaryDescription_(data);
    if(currentDescription.length>description.length)description=currentDescription;
  });

  const ranked=rankProductImages_(images,id);
  return {title:title,images:dominantBlibliGallery_(ranked),price:price,currency:currency,description:description};
}
function decodeHtml_(s){return String(s||'').replace(/&amp;/g,'&').replace(/&#x2F;|&#47;/ig,'/').replace(/&quot;/g,'"').replace(/\\u002F/ig,'/').replace(/\\u003A/ig,':').replace(/\\u0026/ig,'&').replace(/\\u003D/ig,'=').replace(/\\\//g,'/')}
function cleanDescription_(value){
  let text=decodeHtml_(value||'');
  if(!text)return '';

  text=text
    .replace(/<script[\s\S]*?<\/script>/ig,' ')
    .replace(/<style[\s\S]*?<\/style>/ig,' ')
    .replace(/<br\s*\/?>/ig,'\n')
    .replace(/<\/p>|<\/li>|<\/div>/ig,'\n')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/ig,' ')
    .replace(/&lt;/ig,'<')
    .replace(/&gt;/ig,'>')
    .replace(/&#39;|&apos;/ig,"'")
    .replace(/\r/g,'')
    .replace(/[ \t]+/g,' ')
    .replace(/\n[ \t]+/g,'\n')
    .replace(/\n{3,}/g,'\n\n')
    .trim();

  if(text.length<20)return '';
  return text.slice(0,5000);
}
function extractSummaryDescription_(value){
  const candidates=[];
  const scores={
    productdescription:130,
    description:120,
    shortdescription:115,
    longdescription:115,
    productdetail:105,
    productdetails:105,
    overview:100,
    summary:90
  };

  function visit(node,keyHint){
    if(node===null||node===undefined)return;

    if(typeof node==='string'){
      const key=String(keyHint||'').toLowerCase().replace(/[^a-z]/g,'');
      const score=scores[key]||0;
      if(score){
        const text=cleanDescription_(node);
        if(text)candidates.push({text:text,score:score});
      }
      return;
    }

    if(Array.isArray(node)){
      node.forEach(function(item){visit(item,keyHint)});
      return;
    }

    if(typeof node==='object'){
      Object.keys(node).forEach(function(key){visit(node[key],key)});
    }
  }

  visit(value,'');
  if(!candidates.length)return '';
  candidates.sort(function(a,b){
    if(b.score!==a.score)return b.score-a.score;
    return b.text.length-a.text.length;
  });
  return candidates[0].text;
}
function normalizePrice_(value){
  if(value===null||value===undefined)return '';
  if(typeof value==='number'){
    return isFinite(value)&&value>0?String(Math.round(value)):'';
  }

  let text=String(value).trim().replace(/^Rp\s*/i,'').replace(/\s+/g,'');
  if(!text)return '';

  // Indonesian thousands format: 15.900 / 1.299.000.
  if(/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(text)){
    const numeric=Number(text.replace(/\./g,'').replace(',','.'));
    return isFinite(numeric)&&numeric>0?String(Math.round(numeric)):'';
  }

  // API numeric strings such as 15900 or 15900.0.
  if(/^\d+(?:\.\d+)?$/.test(text)){
    const numeric=Number(text);
    return isFinite(numeric)&&numeric>0?String(Math.round(numeric)):'';
  }

  const digits=text.replace(/[^0-9]/g,'');
  if(!digits)return '';
  const numeric=Number(digits);
  return isFinite(numeric)&&numeric>0?String(Math.round(numeric)):'';
}
function extractSummaryPrice_(value){
  const candidates=[];
  let currency='';

  const priority={
    finalprice:120,
    saleprice:115,
    sellingprice:112,
    offerprice:110,
    discountedprice:108,
    currentprice:106,
    itemprice:104,
    price:100,
    minprice:80,
    originalprice:20,
    strikeprice:15,
    strikethroughprice:15
  };

  function visit(node,keyHint){
    if(node===null||node===undefined)return;

    if(typeof node==='number'||typeof node==='string'){
      const key=String(keyHint||'').toLowerCase().replace(/[^a-z]/g,'');
      if(/currency/.test(key)){
        const cur=String(node).trim().toUpperCase();
        if(/^[A-Z]{3}$/.test(cur))currency=cur;
        return;
      }

      if(Object.prototype.hasOwnProperty.call(priority,key)){
        const price=normalizePrice_(node);
        if(price)candidates.push({price:price,score:priority[key]});
      }
      return;
    }

    if(Array.isArray(node)){
      node.forEach(function(item){visit(item,keyHint)});
      return;
    }

    if(typeof node==='object'){
      Object.keys(node).forEach(function(key){visit(node[key],key)});
    }
  }

  visit(value,'');
  if(!candidates.length)return {price:'',currency:currency||''};

  candidates.sort(function(a,b){
    if(b.score!==a.score)return b.score-a.score;
    return Number(a.price)-Number(b.price);
  });

  return {price:candidates[0].price,currency:currency||'IDR'};
}
function extractSerializedPrice_(text){
  const value=decodeHtml_(text||'');
  const raw=pick_(value,[
    /"(?:finalPrice|salePrice|sellingPrice|offerPrice|discountedPrice|currentPrice|itemPrice|price)"\s*:\s*"?([0-9][0-9.,]*)"?/i,
    /"(?:formattedPrice|formattedValue|displayPrice|priceDisplay)"\s*:\s*"Rp\s*([0-9][0-9.,]*)"/i,
    /"amount"\s*:\s*"?([0-9][0-9.,]*)"?\s*,\s*"currency"\s*:\s*"IDR"/i
  ]);
  return {price:normalizePrice_(raw),currency:raw?'IDR':''};
}
function extractHtmlPrice_(html){
  const value=decodeHtml_(html||'');
  let raw=pick_(value,[
    /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
    /"(?:finalPrice|salePrice|sellingPrice|offerPrice|discountedPrice|currentPrice|itemPrice)"\s*:\s*"?([0-9][0-9.,]*)"?/i,
    /"(?:formattedPrice|formattedValue|displayPrice|priceDisplay)"\s*:\s*"Rp\s*([0-9][0-9.,]*)"/i,
    /(?:^|[>\s])Rp\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{1,2})?)(?:[<\s]|$)/i
  ]);
  if(!raw)raw=pick_(value,[/"price"\s*:\s*"?([0-9][0-9.,]*)"?/i]);
  return normalizePrice_(raw);
}
function searchPriceData_(id,title,referer){
  const exactId=String(id||'').trim().toUpperCase();
  const baseId=exactId.replace(/-\d{5}$/,'');
  const terms=[String(id||'').trim(),String(title||'').trim()].filter(Boolean);
  const candidates=[];

  function visit(node){
    if(!node||typeof node!=='object')return;

    if(Array.isArray(node)){
      node.forEach(visit);
      return;
    }

    const own=[];
    Object.keys(node).forEach(function(key){
      const value=node[key];
      if(typeof value==='string'||typeof value==='number')own.push(String(value).toUpperCase());
    });
    const joined=own.join(' ');
    let score=0;
    if(exactId&&joined.indexOf(exactId)>=0)score=300;
    else if(baseId&&joined.indexOf(baseId)>=0)score=220;

    if(score){
      let data=extractSummaryPrice_(node);
      if(!data.price)data=extractSerializedPrice_(JSON.stringify(node));
      const price=normalizePrice_(data.price);
      if(price)candidates.push({price:price,currency:data.currency||'IDR',score:score});
    }

    Object.keys(node).forEach(function(key){
      const child=node[key];
      if(child&&typeof child==='object')visit(child);
    });
  }

  for(let i=0;i<terms.length;i++){
    const endpoint='https://www.blibli.com/backend/search/products?searchTerm='+encodeURIComponent(terms[i])+'&start=0&itemPerPage=24';
    const payload=fetchJson_(endpoint,referer||'https://www.blibli.com/');
    if(!payload)continue;
    visit(payload);
    if(candidates.some(function(row){return row.score>=300}))break;
  }

  if(!candidates.length)return {price:'',currency:''};
  candidates.sort(function(a,b){
    if(b.score!==a.score)return b.score-a.score;
    return Number(a.price)-Number(b.price);
  });
  return {price:candidates[0].price,currency:candidates[0].currency||'IDR'};
}
function refreshPriceForProduct_(p){
  if(!p||!p.id)return p;

  // Cheapest path first: Blibli search normally exposes sell price in one request.
  let priceData=searchPriceData_(p.id,p.name,p.canonicalUrl||p.affiliateUrl);

  // Fall back to product summary only when search is unavailable.
  if(!priceData.price){
    const summary=summaryData_(p.canonicalUrl||p.affiliateUrl,p.id,p.canonicalUrl||p.affiliateUrl);
    priceData={price:summary.price||'',currency:summary.currency||''};
  }

  // Final fallback: PDP HTML.
  if(!priceData.price){
    const html=fetchText_(p.canonicalUrl||p.affiliateUrl);
    priceData={
      price:extractHtmlPrice_(html),
      currency:pick_(html,[/<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,/"priceCurrency"\s*:\s*"([^"]+)"/i])||''
    };
  }

  const price=normalizePrice_(priceData.price);
  if(!price)return p;

  return Object.assign({},p,{
    price:price,
    currency:String(priceData.currency||p.currency||'IDR').toUpperCase(),
    priceUpdatedAt:new Date().toISOString(),
    source:'live-price'
  });
}
function publicPrice_(id){
  if(!/^[A-Za-z0-9-]{3,100}$/.test(id))throw new Error('Product ID tidak valid');
  const cached=readProducts_(PUBLISHED_SHEET).find(function(p){return p.id===id});
  if(!cached)throw new Error('Produk tidak ditemukan');

  // Thirty minutes feels live to a visitor while keeping external requests low.
  if(priceIsFresh_(cached,30*60*1000)){
    return {ok:true,id:id,price:cached.price||null,currency:cached.currency||null,priceUpdatedAt:cached.priceUpdatedAt||null,refreshed:false};
  }

  const cache=CacheService.getScriptCache();
  const throttleKey='price-attempt-'+id;
  if(cache.get(throttleKey)){
    return {ok:true,id:id,price:cached.price||null,currency:cached.currency||null,priceUpdatedAt:cached.priceUpdatedAt||null,refreshed:false};
  }
  cache.put(throttleKey,'1',300);

  const lock=LockService.getScriptLock();
  if(!lock.tryLock(1500)){
    return {ok:true,id:id,price:cached.price||null,currency:cached.currency||null,priceUpdatedAt:cached.priceUpdatedAt||null,refreshed:false};
  }

  try{
    const fresh=refreshPriceForProduct_(cached);
    if(normalizePrice_(fresh.price)){
      upsert_(DRAFT_SHEET,fresh);
      upsert_(PUBLISHED_SHEET,fresh);
      SpreadsheetApp.flush();
    }
    return {ok:true,id:id,price:fresh.price||cached.price||null,currency:fresh.currency||cached.currency||null,priceUpdatedAt:fresh.priceUpdatedAt||cached.priceUpdatedAt||null,refreshed:!!fresh.priceUpdatedAt&&fresh.priceUpdatedAt!==cached.priceUpdatedAt};
  }finally{
    if(lock.hasLock())lock.releaseLock();
  }
}
function scheduledRefreshPrices(){
  ensureSchema_();
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(5000))return;

  try{
    const products=readProducts_(PUBLISHED_SHEET);
    if(!products.length)return;

    const props=PropertiesService.getScriptProperties();
    let cursor=Number(props.getProperty('PRICE_CURSOR')||0);
    if(!isFinite(cursor)||cursor<0)cursor=0;

    const batchSize=20;
    let processed=0;
    let updated=0;

    while(processed<batchSize&&processed<products.length){
      const index=(cursor+processed)%products.length;
      const current=products[index];
      try{
        const fresh=refreshPriceForProduct_(current);
        if(normalizePrice_(fresh.price)){
          upsert_(DRAFT_SHEET,fresh);
          upsert_(PUBLISHED_SHEET,fresh);
          updated++;
        }
      }catch(e){}
      processed++;
    }

    cursor=(cursor+processed)%products.length;
    props.setProperty('PRICE_CURSOR',String(cursor));
    SpreadsheetApp.flush();
    log_('PRICE_BATCH','ALL','OK',updated+' updated / '+processed+' checked; next='+cursor);
  }finally{
    if(lock.hasLock())lock.releaseLock();
  }
}
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
