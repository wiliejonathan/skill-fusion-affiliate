const SHEET_ID = '1V3LTciKM0AAXQAbdk-1eNk6Ie0aXL_ksvSDBzDVjUI0';
const DRAFT_SHEET = 'Draft';
const PUBLISHED_SHEET = 'Published';
const CONFIG_SHEET = 'Config';
const LOG_SHEET = 'Logs';
const HEADERS = ['sequence','id','canonicalProductId','name','brand','category','images_json','affiliateUrl','canonicalUrl','badge','features_json','price','currency','updatedAt','source','description','priceUpdatedAt','pickupPointCode','variants_json','soldText','originalPrice','discountPercent','specifications_json'];

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
    if(action==='health') out={ok:true,service:'skill-fusion-apps-script',version:14,time:new Date().toISOString()};
    else if(action==='catalog'){
      try{disableLegacyPriceRefreshTriggers_()}catch(triggerError){}
      out={ok:true,products:readProducts_(PUBLISHED_SHEET)};
    }
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
    try{disableLegacyPriceRefreshTriggers_()}catch(triggerError){}
    const action=String(p.action||'');
    if(action==='draft')return output_({ok:true,products:readProducts_(DRAFT_SHEET)});
    if(action==='resolve')return output_(resolveProduct_(String(p.url||'')));
    if(['savePublish','reloadDom','reload','reloadAll','publish','publishAll','delete'].indexOf(action)<0)throw new Error('Action tidak dikenal');
    lock=LockService.getScriptLock();
    if(!lock.tryLock(30000))throw new Error('Database sedang diproses. Coba lagi.');
    let out;
    if(action==='savePublish')out=savePublish_(p);
    else if(action==='reloadDom')out=reloadDom_(String(p.url||''));
    else if(action==='reload')out=reloadOne_(String(p.id||''));
    else if(action==='reloadAll')out=reloadAll_();
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
function resolvedShape_(p,input){return {ok:true,inputUrl:input,finalUrl:p.canonicalUrl,canonicalUrl:p.canonicalUrl,canonicalProductId:p.id,title:p.name,image:p.images[0]||null,images:p.images,price:p.price||null,currency:p.currency||null,originalPrice:p.originalPrice||null,discountPercent:p.discountPercent||null,soldText:p.soldText||null,description:p.description||null,specifications:Array.isArray(p.specifications)?p.specifications:[],priceUpdatedAt:p.priceUpdatedAt||null,pickupPointCode:p.pickupPointCode||null,variants:Array.isArray(p.variants)?p.variants:[]}}
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
    description:'',
    pickupPointCode:'',
    variants:[],
    soldText:'',
    originalPrice:'',
    discountPercent:'',
    specifications:[]
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
  return Object.assign({},p,{id:id,canonicalProductId:id,features:Array.isArray(p.features)?p.features.map(String):[],images:unique_(p.images),name:String(p.name).trim(),description:cleanDescription_(p.description||''),variants:normalizeVariants_(p.variants||[]),soldText:cleanSoldText_(p.soldText||''),originalPrice:normalizePrice_(p.originalPrice||''),discountPercent:normalizeDiscountPercent_(p.discountPercent||''),specifications:normalizeSpecifications_(p.specifications||[])});
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
    if(current&&!String(p.pickupPointCode||'').trim()&&String(current.pickupPointCode||'').trim()){
      p.pickupPointCode=current.pickupPointCode;
    }
    if(current&&(!Array.isArray(p.variants)||!p.variants.length)&&Array.isArray(current.variants)&&current.variants.length){
      p.variants=current.variants;
    }
    if(current&&!cleanSoldText_(p.soldText||'')&&cleanSoldText_(current.soldText||''))p.soldText=current.soldText;
    if(current&&!normalizePrice_(p.originalPrice||'')&&normalizePrice_(current.originalPrice||''))p.originalPrice=current.originalPrice;
    if(current&&!normalizeDiscountPercent_(p.discountPercent||'')&&normalizeDiscountPercent_(current.discountPercent||''))p.discountPercent=current.discountPercent;
    if(current&&(!Array.isArray(p.specifications)||!p.specifications.length)&&Array.isArray(current.specifications)&&current.specifications.length)p.specifications=current.specifications;

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
function disableLegacyPriceRefreshTriggers_(){
  if(typeof ScriptApp==='undefined')return;
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()==='scheduledRefreshPrices')ScriptApp.deleteTrigger(t);
  });
}
function ensurePriceRefreshTrigger_(){
  // Live-commerce refresh is intentionally disabled. Blibli rejects cloud
  // scraping with anti-bot HTTP 403, so only stable catalog fields are served.
  disableLegacyPriceRefreshTriggers_();
}
function setupPriceRefreshTrigger(){
  disableLegacyPriceRefreshTriggers_();
  return {ok:true,disabled:true};
}
function config_(){
  const values=sheet_(CONFIG_SHEET).getDataRange().getValues(),map={};
  for(let i=1;i<values.length;i++){if(values[i][0])map[String(values[i][0])]=String(values[i][1]||'')}
  return map;
}
function requireAdmin_(key){const expected=config_().ADMIN_KEY;if(!expected||String(key||'')!==expected){const e=new Error('Admin key salah');e.code='UNAUTHORIZED';throw e}}
function log_(action,id,status,message){sheet_(LOG_SHEET).appendRow([new Date(),action,id||'',status,message||''])}

function rowToProduct_(r){
  let images=[],features=[],variants=[],specifications=[];
  try{images=JSON.parse(r[6]||'[]')}catch(e){}
  try{features=JSON.parse(r[10]||'[]')}catch(e){}
  try{variants=JSON.parse(r[18]||'[]')}catch(e){}
  try{specifications=JSON.parse(r[22]||'[]')}catch(e){}
  return {sequence:Number(r[0])||0,id:String(r[1]||''),canonicalProductId:String(r[2]||r[1]||''),name:String(r[3]||''),brand:String(r[4]||''),category:String(r[5]||''),images:Array.isArray(images)?images:[],affiliateUrl:String(r[7]||''),canonicalUrl:String(r[8]||''),badge:String(r[9]||'Blibli Affiliate'),features:Array.isArray(features)?features:[],price:String(r[11]||''),currency:String(r[12]||''),description:String(r[15]||''),priceUpdatedAt:String(r[16]||''),pickupPointCode:String(r[17]||''),variants:Array.isArray(variants)?variants:[],soldText:String(r[19]||''),originalPrice:String(r[20]||''),discountPercent:String(r[21]||''),specifications:Array.isArray(specifications)?specifications:[]};
}
function safeCell_(value){return typeof value==='string'&&/^[=+@-]/.test(value)?"'"+value:value}
function productToRow_(p){return [p.sequence,p.id,p.canonicalProductId||p.id,p.name,p.brand,p.category,JSON.stringify(p.images||[]),p.affiliateUrl,p.canonicalUrl||'',p.badge||'Blibli Affiliate',JSON.stringify(p.features||[]),p.price||'',p.currency||'',new Date().toISOString(),p.source||'apps-script',p.description||'',p.priceUpdatedAt||'',p.pickupPointCode||'',JSON.stringify(p.variants||[]),p.soldText||'',p.originalPrice||'',p.discountPercent||'',JSON.stringify(p.specifications||[])].map(safeCell_)}
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
  const pickupPointCode=pickupPointCode_(pricingUrl)||p.pickupPointCode||'';
  const pageSession=blibliSession_(pricingUrl);
  const html=fetchTextSession_(pricingUrl,pageSession)||fetchText_(pricingUrl);
  const domData=extractBlibliDomData_(html);
  let title=pick_(html,[/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,/<title[^>]*>([^<]+)<\/title>/i])||p.name;

  // Blibli's visible gallery is rendered as heroThumbnails. Read that exact DOM
  // structure first, then merge other Blibli HTML/JSON sources.
  const heroImages=extractHeroThumbnails_(html);
  const htmlImages=extractBlibliGallery_(html,canonical);
  let gathered=heroImages.concat(htmlImages);

  const summary=summaryData_(canonical,id,pricingUrl,pageSession);
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
  const htmlPrice=domData.price||extractHtmlPrice_(html);
  const htmlCurrency=pick_(html,[/<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,/"priceCurrency"\s*:\s*"([^"]+)"/i]);
  const seoData=seoProductPageData_(Object.assign({},p,{id:id,name:title,canonicalUrl:canonical,pickupPointCode:pickupPointCode}));
  const readerNeeded=!summary.price&&!htmlPrice&&!seoData.price||!summary.description||!summary.variants.length||!summary.specifications.length;
  const readerData=readerNeeded?readerProductData_(Object.assign({},p,{id:id,name:title,canonicalUrl:canonical,pickupPointCode:pickupPointCode})):emptyReaderData_();
  if(isUsableProductTitle_(readerData.title))title=readerData.title;
  const searchPrice=(!summary.price&&!htmlPrice&&!seoData.price&&!readerData.price)?searchPriceData_(id,title,canonical):{price:'',currency:''};
  const freshPrice=normalizePrice_(summary.price||htmlPrice||seoData.price||readerData.price||searchPrice.price||'');
  const price=normalizePrice_(freshPrice||p.price||'');
  const currency=(summary.currency||htmlCurrency||seoData.currency||readerData.currency||searchPrice.currency||p.currency||(price?'IDR':'')).toUpperCase();
  const priceUpdatedAt=freshPrice?new Date().toISOString():(p.priceUpdatedAt||'');
  const htmlDescription=pick_(html,[
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
  ]);
  const description=cleanDescription_(domData.description||summary.description||readerData.description||seoData.description||htmlDescription||p.description||'');
  const variants=normalizeVariants_(
    (domData.variants&&domData.variants.length?domData.variants:null)||
    (summary.variants&&summary.variants.length?summary.variants:null)||
    (readerData.variants&&readerData.variants.length?readerData.variants:null)||
    (seoData.variants&&seoData.variants.length?seoData.variants:null)||
    p.variants||[]
  );
  const specifications=normalizeSpecifications_((domData.specifications&&domData.specifications.length?domData.specifications:(summary.specifications&&summary.specifications.length?summary.specifications:(readerData.specifications&&readerData.specifications.length?readerData.specifications:p.specifications)))||[]);
  const soldText=cleanSoldText_(domData.soldText||summary.soldText||readerData.soldText||p.soldText||'');
  const originalPrice=normalizePrice_(domData.originalPrice||summary.originalPrice||readerData.originalPrice||p.originalPrice||'');
  const discountPercent=normalizeDiscountPercent_(domData.discountPercent||summary.discountPercent||readerData.discountPercent||p.discountPercent||'');
  const brand=domData.brand||summary.brand||readerData.brand||specValue_(specifications,'Merk')||p.brand||inferBrand_(title,id);
  const category=domData.category||summary.category||readerData.category||specValue_(specifications,'Kategori')||p.category||'';
  if(!isUsableProductTitle_(title))title=p.name;
  return Object.assign({},p,{id:id,canonicalProductId:id,name:title,brand:brand,category:category,features:inferFeatures_(title),canonicalUrl:canonical,images:finalGallery,price:price,currency:currency,originalPrice:originalPrice,discountPercent:discountPercent,soldText:soldText,description:description,specifications:specifications,variants:variants,priceUpdatedAt:priceUpdatedAt,pickupPointCode:pickupPointCode,source:'blibli-reload'});
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
// Apps Script V8 has no browser URL or URLSearchParams globals. This helper
// supports the absolute HTTP(S) URLs and query operations used by this script.
function parseHttpUrl_(value){
  const match=String(value||'').trim().match(/^(https?):\/\/([^\s\/?#]+)(\/[^\s?#]*)?(\?[^\s#]*)?(#[^\s]*)?$/i);
  if(!match)throw new Error('URL HTTP(S) tidak valid');
  const url={origin:match[1].toLowerCase()+'://'+match[2],pathname:match[3]||'/',search:match[4]||'',hash:match[5]||''};
  function decode(value){try{return decodeURIComponent(value.replace(/\+/g,' '))}catch(e){return value}}
  function entries(){return url.search.replace(/^\?/,'').split('&').filter(Boolean).map(function(part){
    const i=part.indexOf('=');
    return [decode(i<0?part:part.slice(0,i)),decode(i<0?'':part.slice(i+1))];
  })}
  function write(pairs){const query=pairs.map(function(pair){return encodeURIComponent(pair[0])+'='+encodeURIComponent(pair[1])}).join('&');url.search=query?'?'+query:''}
  url.searchParams={
    get:function(key){const pair=entries().find(function(pair){return pair[0]===key});return pair?pair[1]:null},
    set:function(key,value){const pairs=entries().filter(function(pair){return pair[0]!==key});pairs.push([key,String(value)]);write(pairs)},
    delete:function(key){write(entries().filter(function(pair){return pair[0]!==key}))}
  };
  url.toString=function(){return url.origin+url.pathname+url.search+url.hash};
  return url;
}
function pickupPointCode_(value){
  try{
    const u=parseHttpUrl_(String(value||''));
    return String(u.searchParams.get('pickupPointCode')||'').trim();
  }catch(e){
    const m=String(value||'').match(/[?&]pickupPointCode=([^&#]+)/i);
    return m&&m[1]?decodeURIComponent(m[1]):'';
  }
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
function fetchJsonFast_(url,referer){
  const attempts=[
    {'User-Agent':PRODUCT_FETCH_UAS[0]},
    {
      Accept:'application/json,text/plain,*/*',
      'Accept-Language':'id-ID,id;q=0.9,en;q=0.8',
      'Cache-Control':'no-cache',
      Pragma:'no-cache',
      Referer:referer||'https://www.blibli.com/',
      'User-Agent':PRODUCT_FETCH_UAS[1]
    },
    {'User-Agent':PRODUCT_FETCH_UAS[2]}
  ];

  for(let i=0;i<attempts.length;i++){
    try{
      const r=UrlFetchApp.fetch(url,{
        muteHttpExceptions:true,
        followRedirects:true,
        headers:attempts[i]
      });
      if(r.getResponseCode()<200||r.getResponseCode()>=300)continue;
      const body=r.getContentText();
      if(!body)continue;
      const parsed=JSON.parse(body);
      if(parsed)return parsed;
    }catch(e){}
  }
  return null;
}
function headerValues_(headers,name){
  const out=[];
  const wanted=String(name||'').toLowerCase();
  Object.keys(headers||{}).forEach(function(key){
    if(String(key).toLowerCase()!==wanted)return;
    const value=headers[key];
    if(Array.isArray(value))value.forEach(function(v){if(v!==null&&v!==undefined)out.push(String(v))});
    else if(value!==null&&value!==undefined)out.push(String(value));
  });
  return out;
}
function mergeSessionCookies_(session,headers){
  if(!session)session={cookies:{}};
  if(!session.cookies)session.cookies={};
  headerValues_(headers,'set-cookie').forEach(function(raw){
    // Apps Script may expose multiple Set-Cookie headers either as an array or
    // as one comma-joined string. Match cookie starts without treating Path,
    // Expires, SameSite, etc. as cookies.
    const re=/(?:^|,\s*)([!#$%&'*+\-.^_`|~0-9A-Za-z]+)=([^;,]*)/g;
    let m;
    while((m=re.exec(String(raw||'')))){
      const key=String(m[1]||'').trim();
      if(!key||/^(?:path|expires|max-age|domain|samesite|secure|httponly)$/i.test(key))continue;
      session.cookies[key]=String(m[2]||'').trim();
    }
  });
  return session;
}
function sessionCookieHeader_(session){
  const cookies=(session&&session.cookies)||{};
  return Object.keys(cookies).map(function(key){return key+'='+cookies[key]}).join('; ');
}
function responseDiagnostic_(label,response){
  try{
    const code=response.getResponseCode();
    const headers=response.getAllHeaders()||{};
    const type=(headerValues_(headers,'content-type')[0]||'').split(';')[0];
    const body=response.getContentText()||'';
    return label+':'+code+(type?':'+type:'')+':'+body.length+'b';
  }catch(e){
    return label+':ERR';
  }
}
function blibliSession_(referer){
  const session={cookies:{},ua:PRODUCT_FETCH_UAS[1],diagnostics:[]};
  if(typeof UrlFetchApp==='undefined')return session;
  const targets=[];
  const ref=String(referer||'');
  if(/^https:\/\/(?:www\.)?blibli\.com(?:[/?#]|$)/i.test(ref))targets.push(ref);
  targets.push('https://www.blibli.com/');
  const seen={};
  for(let i=0;i<targets.length&&i<2;i++){
    const target=targets[i];
    if(seen[target])continue;
    seen[target]=true;
    try{
      const r=UrlFetchApp.fetch(target,{
        muteHttpExceptions:true,
        followRedirects:true,
        headers:{
          Accept:'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language':'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control':'no-cache',
          Pragma:'no-cache',
          'Upgrade-Insecure-Requests':'1',
          'Sec-Fetch-Dest':'document',
          'Sec-Fetch-Mode':'navigate',
          'Sec-Fetch-Site':'none',
          'User-Agent':session.ua
        }
      });
      mergeSessionCookies_(session,r.getAllHeaders()||{});
      session.diagnostics.push(responseDiagnostic_('warmup'+i,r));
      const code=r.getResponseCode();
      if(code>=200&&code<400&&sessionCookieHeader_(session))break;
    }catch(e){
      session.diagnostics.push('warmup'+i+':ERR:'+String(e&&e.message||e).slice(0,120));
    }
  }
  return session;
}
function fetchJsonSession_(url,referer,session){
  if(typeof UrlFetchApp==='undefined')return null;
  session=session||blibliSession_(referer);
  const uas=[session.ua||PRODUCT_FETCH_UAS[1],PRODUCT_FETCH_UAS[2],PRODUCT_FETCH_UAS[0]];
  for(let i=0;i<uas.length;i++){
    try{
      const cookie=sessionCookieHeader_(session);
      const headers={
        Accept:'application/json,text/plain,*/*',
        'Accept-Language':'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control':'no-cache',
        Pragma:'no-cache',
        Referer:referer||'https://www.blibli.com/',
        Origin:'https://www.blibli.com',
        'X-Requested-With':'XMLHttpRequest',
        'Sec-Fetch-Dest':'empty',
        'Sec-Fetch-Mode':'cors',
        'Sec-Fetch-Site':'same-origin',
        'User-Agent':uas[i]
      };
      if(cookie)headers.Cookie=cookie;
      const r=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true,headers:headers});
      mergeSessionCookies_(session,r.getAllHeaders()||{});
      session.diagnostics.push(responseDiagnostic_('json'+i,r));
      const code=r.getResponseCode();
      if(code<200||code>=300)continue;
      let body=r.getContentText()||'';
      if(!body)continue;
      body=body.replace(/^\s*for\s*\(\s*;\s*;\s*\)\s*;?\s*/,'');
      const parsed=JSON.parse(body);
      if(parsed)return parsed;
    }catch(e){
      session.diagnostics.push('json'+i+':ERR:'+String(e&&e.message||e).slice(0,120));
    }
  }
  return null;
}
function fetchTextSession_(url,session){
  if(typeof UrlFetchApp==='undefined')return '';
  session=session||blibliSession_(url);
  try{
    const cookie=sessionCookieHeader_(session);
    const headers={
      Accept:'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language':'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control':'no-cache',
      Pragma:'no-cache',
      'Upgrade-Insecure-Requests':'1',
      'Sec-Fetch-Dest':'document',
      'Sec-Fetch-Mode':'navigate',
      'Sec-Fetch-Site':'same-origin',
      'User-Agent':session.ua||PRODUCT_FETCH_UAS[1]
    };
    if(cookie)headers.Cookie=cookie;
    const r=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true,headers:headers});
    mergeSessionCookies_(session,r.getAllHeaders()||{});
    session.diagnostics.push(responseDiagnostic_('html',r));
    if(r.getResponseCode()>=200&&r.getResponseCode()<400)return r.getContentText()||'';
  }catch(e){
    session.diagnostics.push('html:ERR:'+String(e&&e.message||e).slice(0,120));
  }
  return '';
}
function recursiveScalarByKeys_(value,keys){
  const wanted={};
  (keys||[]).forEach(function(key){wanted[String(key).toLowerCase().replace(/[^a-z0-9]/g,'')]=true});
  let found='';
  function visit(node){
    if(found!==''||node===null||node===undefined)return;
    if(Array.isArray(node)){for(let i=0;i<node.length&&!found;i++)visit(node[i]);return}
    if(typeof node!=='object')return;
    const own=Object.keys(node);
    for(let i=0;i<own.length;i++){
      const key=own[i];
      const normalized=String(key).toLowerCase().replace(/[^a-z0-9]/g,'');
      const child=node[key];
      if(wanted[normalized]&&(typeof child==='string'||typeof child==='number')){
        const text=String(child).trim();
        if(text){found=text;return}
      }
    }
    for(let i=0;i<own.length&&!found;i++){
      const child=node[own[i]];
      if(child&&typeof child==='object')visit(child);
    }
  }
  visit(value);
  return found;
}
function formatSoldCount_(value){
  const raw=cleanInlineText_(value);
  if(!raw)return '';
  if(/^terjual\b/i.test(raw))return raw.slice(0,80);
  if(/[a-z]/i.test(raw))return cleanSoldText_(raw);
  const n=Number(String(raw).replace(/[^0-9]/g,''));
  if(!isFinite(n)||n<=0)return cleanSoldText_(raw);
  if(n>=1000000){
    const v=Math.round(n/100000)/10;
    return 'Terjual '+String(v).replace('.',',')+' jt';
  }
  if(n>=1000){
    const v=Math.round(n/100)/10;
    return 'Terjual '+String(v).replace('.',',')+' rb';
  }
  return 'Terjual '+String(n);
}
function extractSummaryRichVariants_(value){
  const groups={},order=[];
  function ensure(name){
    const label=String(name||'Varian').replace(/\s+/g,' ').trim()||'Varian';
    const key=label.toLowerCase();
    if(!groups[key]){groups[key]={name:label,selected:'',values:[],map:{}};order.push(key)}
    return groups[key];
  }
  function add(name,val,meta){
    const label=String(val||'').replace(/\s+/g,' ').trim();
    if(!label||label.length>100)return;
    const g=ensure(name),key=label.toLowerCase();
    let o=g.map[key];
    if(!o){
      o={name:label,image:'',selected:false,outOfStock:false,_availabilityKnown:false};
      g.map[key]=o;g.values.push(o);
    }
    meta=meta||{};
    if(meta.image&&!o.image)o.image=normalizeImage_(meta.image);
    if(meta.selected){o.selected=true;g.selected=label}
    if(meta.availabilityKnown){
      o.outOfStock=!!meta.outOfStock;
      o._availabilityKnown=true;
    }
  }
  function visit(node){
    if(!node)return;
    if(Array.isArray(node)){node.forEach(visit);return}
    if(typeof node!=='object')return;

    if(Array.isArray(node.attributes)){
      const selected=!!(node.selected||node.isSelected||node.active||node.isActive);
      const availabilityKnown=
        node.available!==undefined||node.inStock!==undefined||node.disabled!==undefined||
        node.outOfStock!==undefined||node.isAvailable!==undefined;
      const outOfStock=
        node.available===false||node.inStock===false||node.disabled===true||
        node.outOfStock===true||node.isAvailable===false;
      const image=node.image||node.imageUrl||node.thumbnail||node.thumbnailUrl||'';
      node.attributes.forEach(function(attr){
        if(!attr||typeof attr!=='object')return;
        const name=attr.name||attr.label||attr.attributeName||attr.variantName||'Varian';
        const val=attr.value||attr.selectedValue||attr.displayValue||attr.text||'';
        if(val)add(name,val,{selected:selected,availabilityKnown:availabilityKnown,outOfStock:outOfStock,image:image});
      });
    }

    if((node.name||node.attributeName)&&Array.isArray(node.values)){
      const name=node.name||node.attributeName;
      node.values.forEach(function(v){
        if(v===null||v===undefined)return;
        if(typeof v==='string'||typeof v==='number')add(name,v,{});
        else if(typeof v==='object'){
          add(name,v.value||v.name||v.label||v.text||v.displayName||'',{
            selected:!!(v.selected||v.isSelected),
            availabilityKnown:v.available!==undefined||v.inStock!==undefined||v.disabled!==undefined||v.outOfStock!==undefined,
            outOfStock:v.available===false||v.inStock===false||v.disabled===true||v.outOfStock===true,
            image:v.image||v.imageUrl||v.thumbnail||v.thumbnailUrl||''
          });
        }
      });
    }

    Object.keys(node).forEach(function(key){
      const child=node[key];
      if(child&&typeof child==='object')visit(child);
    });
  }
  visit(value);

  // Preserve values found by the older broad extractor when the richer option
  // objects expose only the currently-selected SKU.
  extractSummaryVariants_(value).forEach(function(group){
    (group.values||[]).forEach(function(v){
      const name=typeof v==='object'?(v.name||v.value||''):v;
      add(group.name,name,{selected:group.selected&&String(group.selected)===String(name)});
    });
  });

  return order.map(function(key){
    const g=groups[key];
    return {name:g.name,selected:g.selected,values:g.values.map(function(o){
      return {name:o.name,image:o.image,selected:o.selected,outOfStock:o.outOfStock};
    })};
  }).filter(function(g){return g.values.length}).slice(0,12);
}
function extractSummarySpecifications_(value){
  const rows=[],seen={};
  function add(label,val){
    const l=cleanInlineText_(label).replace(/:\s*$/,'').trim();
    const v=cleanInlineText_(val);
    if(!l||!v||l.length>100||v.length>1000)return;
    const key=l.toLowerCase();
    if(seen[key])return;
    seen[key]=true;rows.push({label:l,value:v});
  }
  const brand=(value&&value.brand&&typeof value.brand==='object'&&(value.brand.name||value.brand.label))||
    (value&&typeof value.brand==='string'?value.brand:'')||
    recursiveScalarByKeys_(value,['brandName']);
  if(brand)add('Merk',brand);

  let category='';
  const cats=(value&&Array.isArray(value.categories)&&value.categories)||
    (value&&Array.isArray(value.masterCategories)&&value.masterCategories)||[];
  if(cats.length){
    const sorted=cats.slice().sort(function(a,b){return Number((a&&a.level)||0)-Number((b&&b.level)||0)});
    for(let i=sorted.length-1;i>=0;i--){
      const row=sorted[i];
      const name=row&&typeof row==='object'?(row.name||row.label||row.displayName):row;
      if(name){category=String(name);break}
    }
  }
  if(!category)category=recursiveScalarByKeys_(value,['categoryName']);
  if(category)add('Kategori',category);

  function scan(node,inSpecs){
    if(!node)return;
    if(Array.isArray(node)){node.forEach(function(x){scan(x,inSpecs)});return}
    if(typeof node!=='object')return;
    const label=node.label||node.key||node.specificationName||(inSpecs?node.name:'');
    const val=node.value||node.text||node.displayValue||node.specificationValue;
    if(inSpecs&&label&&val&&(typeof val==='string'||typeof val==='number'))add(label,val);
    Object.keys(node).forEach(function(key){
      const child=node[key];
      if(!child||typeof child!=='object')return;
      const next=inSpecs||/specification|specifications|productdetails|additionalinformation|technicaldetails/i.test(key);
      scan(child,next);
    });
  }
  scan(value,false);
  return normalizeSpecifications_(rows);
}
function extractSummaryCommerce_(value){
  const priceData=extractSummaryPrice_(value);
  const price=normalizePrice_(priceData.price);
  const originalPrice=normalizePrice_(recursiveScalarByKeys_(value,[
    'originalPrice','strikePrice','strikethroughPrice','strikeThroughPrice',
    'beforeDiscount','regularPrice','basePrice','wasPrice'
  ]));
  let discountPercent=normalizeDiscountPercent_(recursiveScalarByKeys_(value,[
    'discountPercentage','discountPercent','percentageDiscount','discountRate','discountPercentageValue'
  ]));
  if(!discountPercent&&price&&originalPrice&&Number(originalPrice)>Number(price)){
    discountPercent=normalizeDiscountPercent_(Math.round((Number(originalPrice)-Number(price))*100/Number(originalPrice)));
  }
  const soldRaw=recursiveScalarByKeys_(value,['sold','soldCount','totalSold','soldQuantity','quantitySold']);
  const specifications=extractSummarySpecifications_(value);
  return {
    price:price,
    currency:priceData.currency||'IDR',
    originalPrice:originalPrice,
    discountPercent:discountPercent,
    soldText:formatSoldCount_(soldRaw),
    description:extractSummaryDescription_(value),
    variants:extractSummaryRichVariants_(value),
    specifications:specifications,
    brand:specValue_(specifications,'Merk'),
    category:specValue_(specifications,'Kategori')
  };
}
function emptyReaderData_(){
  return {title:'',price:'',currency:'',originalPrice:'',discountPercent:'',soldText:'',description:'',variants:[],specifications:[],brand:'',category:'',readerDiagnostics:[]};
}
function stripMarkdown_(value){
  return decodeHtml_(String(value||''))
    .replace(/!\[([^\]]*)\]\([^)]*\)/g,'$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g,'$1')
    .replace(/^[ \t]*#{1,6}[ \t]*/gm,'')
    .replace(/^[ \t]*[-*+][ \t]+/gm,'')
    .replace(/[*_~]/g,'')
    .replace(/&nbsp;/ig,' ')
    .replace(/[ \t]+/g,' ')
    .replace(/\n[ \t]+/g,'\n')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}
function readerSection_(text,startPatterns,stopPatterns){
  const value=String(text||'');
  let start=-1,startLen=0;
  (startPatterns||[]).some(function(pattern){
    const re=pattern instanceof RegExp?new RegExp(pattern.source,pattern.flags.replace('g','')):new RegExp(String(pattern),'i');
    const m=re.exec(value);
    if(m){start=m.index;startLen=m[0].length;return true}
    return false;
  });
  if(start<0)return '';
  const contentStart=start+startLen;
  let end=value.length;
  (stopPatterns||[]).forEach(function(pattern){
    const re=pattern instanceof RegExp?new RegExp(pattern.source,pattern.flags.replace('g','')):new RegExp(String(pattern),'i');
    const tail=value.slice(contentStart);
    const m=re.exec(tail);
    if(m&&contentStart+m.index<end)end=contentStart+m.index;
  });
  return value.slice(contentStart,end).trim();
}
function parseReaderVariants_(text,title){
  const groups=[];
  [
    {name:'Warna',starts:[/(?:^|\n)#{1,6}\s*Warna\s*:?\s*(?:\n|$)/i,/(?:^|\n)Warna\s*:\s*(?:\n|$)/i],stops:[/(?:^|\n)#{1,6}\s*(?:Kode Produk|Deskripsi|Ukuran|Size|Kapasitas|Storage|Spesifikasi|Ulasan)\b/im]},
    {name:'Ukuran',starts:[/(?:^|\n)#{1,6}\s*(?:Ukuran|Size)\s*:?\s*(?:\n|$)/i],stops:[/(?:^|\n)#{1,6}\s*(?:Kode Produk|Deskripsi|Warna|Kapasitas|Storage|Spesifikasi|Ulasan)\b/im]},
    {name:'Kapasitas',starts:[/(?:^|\n)#{1,6}\s*(?:Kapasitas|Storage)\s*:?\s*(?:\n|$)/i],stops:[/(?:^|\n)#{1,6}\s*(?:Kode Produk|Deskripsi|Warna|Ukuran|Size|Spesifikasi|Ulasan)\b/im]}
  ].forEach(function(def){
    const section=readerSection_(text,def.starts,def.stops);
    if(!section)return;
    const values=[],seen={};
    let m;
    const linkRe=/\[([^\]]{1,100})\]\([^)]*\)/g;
    while((m=linkRe.exec(section))){
      const v=stripMarkdown_(m[1]).trim();
      if(v&&!seen[v.toLowerCase()]){seen[v.toLowerCase()]=true;values.push(v)}
    }
    if(!values.length){
      stripMarkdown_(section).split(/\n|\s*\|\s*|\s*,\s*/).forEach(function(raw){
        const v=String(raw||'').replace(/^\d+[.)]\s*/,'').trim();
        if(!v||v.length>80||/^kode produk/i.test(v))return;
        const key=v.toLowerCase();
        if(!seen[key]){seen[key]=true;values.push(v)}
      });
    }
    if(def.name==='Warna'&&values.length===1){
      const known=values[0].match(/(?:space\s+gr[ae]y|light\s+green|dark\s+blue|light\s+blue|rose\s+gold|midnight\s+blue|tosca|red|blue|green|black|white|gray|grey|pink|purple|yellow|orange|silver|gold)/ig);
      if(known&&known.length>=2){
        values.length=0;
        Object.keys(seen).forEach(function(k){delete seen[k]});
        known.forEach(function(v){const key=v.toLowerCase();if(!seen[key]){seen[key]=true;values.push(v)}})
      }
    }
    if(!values.length)return;
    let selected='';
    const lowTitle=String(title||'').toLowerCase();
    values.forEach(function(v){
      if(!selected&&lowTitle.indexOf(String(v).toLowerCase())>=0)selected=v;
    });
    groups.push({
      name:def.name,
      selected:selected,
      values:values.slice(0,30).map(function(v){return {name:v,image:'',selected:!!selected&&v===selected,outOfStock:false}})
    });
  });
  return normalizeVariants_(groups);
}
function parseReaderSpecifications_(text){
  const section=readerSection_(text,[
    /(?:^|\n)#{1,6}\s*Spesifikasi\s*(?:\n|$)/i,
    /(?:^|\n)Spesifikasi\s*:?\s*(?:\n|$)/i
  ],[
    /(?:^|\n)#{1,6}\s*(?:Ulasan|Review|Produk|Rekomendasi)\b/im
  ]);
  const rows=[];
  function add(label,value){if(label&&value)rows.push({label:label,value:value})}
  const visible=stripMarkdown_(section);
  const prefixes=[
    ['Brand','Merk'],['Merk','Merk'],['Kategori','Kategori'],['Jenis Produk','Jenis Produk'],
    ['Panjang Kabel','Panjang Kabel'],['Tipe Garansi','Tipe Garansi'],['Lama Garansi','Lama Garansi'],
    ['Detail Garansi','Detail Garansi'],['Model','Model'],['Material','Material'],['Warna','Warna']
  ];
  visible.split(/\n/).forEach(function(line){
    const s=String(line||'').trim();
    if(!s)return;
    let matched=false;
    prefixes.some(function(pair){
      const prefix=String(pair[0]).replace(/[.*+?^$()|[\]\\]/g,'\\$&');
      const re=new RegExp('^'+prefix+'\\s*:?\\s+(.+)$','i');
      const m=s.match(re);
      if(m){add(pair[1],m[1].trim());matched=true;return true}
      return false;
    });
    if(!matched){
      const m=s.match(/^([^:]{2,60})\s*:\s*(.{1,500})$/);
      if(m)add(m[1].trim(),m[2].trim());
    }
  });
  return normalizeSpecifications_(rows);
}
function extractReaderProductData_(text,p){
  const raw=String(text||'');
  const out=emptyReaderData_();
  if(!raw)return out;

  const heading=raw.match(/(?:^|\n)#\s+([^\n]{5,500})/);
  if(heading)out.title=stripMarkdown_(heading[1]).replace(/\s*\[[A-Z0-9-]{5,}\]\s*$/i,'').trim();

  const prices=[];
  const priceRe=/(?:^|\n)\s*Rp\s*([0-9][0-9.]{2,})(?:\s|$)/ig;
  let pm;
  while((pm=priceRe.exec(raw))){
    const price=normalizePrice_(pm[1]);
    if(price&&prices.indexOf(price)<0)prices.push(price);
    if(prices.length>=8)break;
  }
  if(prices.length){
    out.price=prices[0];
    for(let i=1;i<prices.length;i++){
      if(Number(prices[i])>Number(out.price)){out.originalPrice=prices[i];break}
    }
  }

  const discount=raw.match(/Rp\s*[0-9][0-9.]{2,}[ \t]+([0-9]{1,3})\s*%/i)||
    raw.match(/(?:diskon|hemat)\s*([0-9]{1,3})\s*%/i);
  if(discount)out.discountPercent=normalizeDiscountPercent_(discount[1]);
  if(!out.discountPercent&&out.price&&out.originalPrice&&Number(out.originalPrice)>Number(out.price)){
    out.discountPercent=normalizeDiscountPercent_(Math.round((Number(out.originalPrice)-Number(out.price))*100/Number(out.originalPrice)));
  }

  const sold=raw.match(/\bTerjual\s+([0-9][0-9.,]*\s*(?:rb|ribu|jt|juta)?)/i);
  if(sold)out.soldText=cleanSoldText_('Terjual '+sold[1]);

  out.variants=parseReaderVariants_(raw,out.title||p&&p.name||'');

  let desc=readerSection_(raw,[/(?:^|\n)Info Produk\s*:\s*(?:\n|$)/i],[
    /(?:^|\n)#{1,6}\s*Spesifikasi\b/im,
    /(?:^|\n)#{1,6}\s*Ulasan\b/im
  ]);
  if(!desc){
    desc=readerSection_(raw,[/(?:^|\n)#{1,6}\s*Deskripsi(?: Produk)?\s*(?:\n|$)/i],[
      /(?:^|\n)#{1,6}\s*Spesifikasi\b/im,
      /(?:^|\n)#{1,6}\s*Ulasan\b/im,
      /(?:^|\n)#{1,6}\s*Dijual oleh\b/im
    ]);
  }
  out.description=cleanDescription_(stripMarkdown_(desc));

  out.specifications=parseReaderSpecifications_(raw);
  let brand=specValue_(out.specifications,'Merk')||specValue_(out.specifications,'Brand');
  if(!brand){
    const m=stripMarkdown_(raw).match(/(?:^|\n)Merk\s*:?\s*([^\n]{1,100})/i);
    if(m)brand=m[1].trim();
  }
  out.brand=brand||'';
  out.category=specValue_(out.specifications,'Kategori')||specValue_(out.specifications,'Jenis Produk')||'';
  out.currency=out.price?'IDR':'';
  return out;
}
function readerProductData_(p){
  const empty=emptyReaderData_();
  const canonical=String(p&&p.canonicalUrl||p&&p.affiliateUrl||'').split('?')[0];
  if(!/^https:\/\/(?:www\.)?blibli\.com\//i.test(canonical))return empty;
  if(typeof UrlFetchApp==='undefined')return empty;

  const id=String(p&&p.id||productId_(canonical)||'');
  const cache=CacheService.getScriptCache();
  const cacheKey='blibli-reader-v13-'+id;
  if(id){
    try{
      const cached=cache.get(cacheKey);
      if(cached){
        const parsed=JSON.parse(cached);
        parsed.readerDiagnostics=['reader:cache'];
        return parsed;
      }
    }catch(e){}
  }

  const readerUrl='https://r.jina.ai/'+canonical;
  const attempts=[{'X-Engine':'cf-browser-rendering'},{}];
  let diagnostics=[];
  for(let i=0;i<attempts.length;i++){
    try{
      const headers={
        Accept:'application/json',
        'X-Timeout':'30',
        'X-Retain-Images':'none',
        'X-Md-Link-Style':'inline',
        'User-Agent':PRODUCT_FETCH_UAS[1]
      };
      Object.keys(attempts[i]).forEach(function(k){headers[k]=attempts[i][k]});
      const r=UrlFetchApp.fetch(readerUrl,{muteHttpExceptions:true,followRedirects:true,headers:headers});
      const code=r.getResponseCode();
      const body=r.getContentText()||'';
      diagnostics.push('reader'+i+':'+code+':'+body.length+'b');
      if(code<200||code>=300||!body)continue;

      let content=body;
      try{
        const json=JSON.parse(body);
        content=recursiveScalarByKeys_(json,['content','markdown','text'])||body;
      }catch(e){}
      const data=extractReaderProductData_(content,p);
      data.readerDiagnostics=diagnostics.slice();
      if(data.price||data.description||data.variants.length||data.specifications.length){
        if(id){
          try{
            const toCache=Object.assign({},data,{readerDiagnostics:[]});
            cache.put(cacheKey,JSON.stringify(toCache),600);
          }catch(cacheError){}
        }
        return data;
      }
    }catch(e){
      diagnostics.push('reader'+i+':ERR:'+String(e&&e.message||e).slice(0,140));
    }
  }
  empty.readerDiagnostics=diagnostics;
  return empty;
}
function fetchTextFast_(url){
  const uas=[PRODUCT_FETCH_UAS[0],PRODUCT_FETCH_UAS[1]];
  for(let i=0;i<uas.length;i++){
    try{
      const r=UrlFetchApp.fetch(url,{
        muteHttpExceptions:true,
        followRedirects:true,
        headers:{
          Accept:'text/html,application/xhtml+xml',
          'Accept-Language':'id-ID,id;q=0.9,en;q=0.8',
          'Cache-Control':'no-cache',
          Pragma:'no-cache',
          'User-Agent':uas[i]
        }
      });
      if(r.getResponseCode()<200||r.getResponseCode()>=400)continue;
      const body=r.getContentText();
      if(body)return body;
    }catch(e){}
  }
  return '';
}
function fetchSeoText_(url,productId){
  const uas=[
    PRODUCT_FETCH_UAS[3], // Googlebot: Blibli exposes SEO product content here.
    PRODUCT_FETCH_UAS[2], // Mobile browser.
    PRODUCT_FETCH_UAS[1], // Desktop browser.
    PRODUCT_FETCH_UAS[0]
  ];

  let best='',bestScore=-1;
  const id=String(productId||'').toLowerCase();
  const base=id.replace(/-\d{5}$/,'');
  const seen={};

  for(let i=0;i<uas.length;i++){
    try{
      const r=UrlFetchApp.fetch(url,{
        muteHttpExceptions:true,
        followRedirects:true,
        headers:{
          Accept:'text/html,application/xhtml+xml',
          'Accept-Language':'id-ID,id;q=0.9,en;q=0.8',
          'Cache-Control':'no-cache',
          Pragma:'no-cache',
          'User-Agent':uas[i]
        }
      });
      if(r.getResponseCode()<200||r.getResponseCode()>=400)continue;

      const body=r.getContentText();
      if(!body)continue;

      const signature=body.length+'|'+body.slice(0,160);
      if(seen[signature])continue;
      seen[signature]=true;

      const low=decodeHtml_(body).toLowerCase();
      let score=0;

      if(id&&low.indexOf(id)>=0)score+=140;
      else if(base&&low.indexOf(base)>=0)score+=100;

      if(/product:price:amount|"(?:listed|finalprice|saleprice|sellingprice|price)"\s*:|rp(?:\s|&nbsp;|<[^>]+>)*[0-9]/i.test(body))score+=120;
      if(/deskripsi produk|uniquesellingpoint|productdescription|productstory/i.test(low))score+=80;
      if(/(?:^|[^a-z])(warna|color|ukuran|size|kapasitas|storage|variant)(?:[^a-z]|$)/i.test(low))score+=45;
      score+=Math.min(40,Math.floor(body.length/100000));

      if(score>bestScore){
        best=body;
        bestScore=score;
      }

      // This is already a rich product response; no reason to keep rotating UA.
      if(score>=260)break;
    }catch(e){}
  }

  return best;
}
function selectedVariantPagePrice_(p){
  const id=String(p&&p.id||'').trim();
  if(!id)return {price:'',currency:''};

  const baseId=id.replace(/-\d{5}$/,'');
  let page=String(p.canonicalUrl||p.affiliateUrl||'');
  try{
    const u=parseHttpUrl_(page);
    if(/\/is--[^/?#]+$/i.test(u.pathname)){
      u.pathname=u.pathname.replace(/\/is--[^/?#]+$/i,'/ps--'+baseId);
    }else if(!/\/ps--[^/?#]+$/i.test(u.pathname)){
      return {price:'',currency:''};
    }
    u.search='';
    u.searchParams.set('defaultItemSku',id);
    u.searchParams.set('cnc','false');
    if(p.pickupPointCode)u.searchParams.set('pickupPointCode',String(p.pickupPointCode));
    page=u.toString();
  }catch(e){
    return {price:'',currency:''};
  }

  const html=fetchSeoText_(page,id);
  if(!html)return {price:'',currency:''};

  const price=extractHtmlPrice_(html);
  if(!price)return {price:'',currency:''};

  const currency=pick_(html,[
    /<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,
    /"priceCurrency"\s*:\s*"([^"]+)"/i
  ])||'IDR';

  return {price:price,currency:String(currency).toUpperCase()};
}
function fastSummaryPrice_(p){
  const id=String(p&&p.id||'').trim();
  if(!id)return {price:'',currency:'',pickupPointCode:p&&p.pickupPointCode||'',description:'',variants:[],originalPrice:'',discountPercent:'',soldText:'',specifications:[],brand:'',category:'',fetchDiagnostics:[]};

  const referer=String(p.canonicalUrl||p.affiliateUrl||'https://www.blibli.com/');
  let pickupPointCode=String(p.pickupPointCode||'').trim();

  if(!pickupPointCode&&p.affiliateUrl){
    try{
      const resolved=resolveUrl_(validBlibliUrl_(p.affiliateUrl));
      pickupPointCode=pickupPointCode_(resolved.finalUrl||'');
    }catch(e){}
  }

  const pickupQuery=pickupPointCode?'pickupPointCode='+encodeURIComponent(pickupPointCode):'';
  const endpoints=[
    'https://www.blibli.com/backend/product-detail/products/is--'+encodeURIComponent(id)+'/_summary'+(pickupQuery?'?'+pickupQuery:'')
  ];

  const productSku=id.replace(/-\d{5}$/,'');
  if(productSku!==id){
    let url='https://www.blibli.com/backend/product-detail/products/ps--'+encodeURIComponent(productSku)+'/_summary?defaultItemSku='+encodeURIComponent(id)+'&cnc=false';
    if(pickupQuery)url+='&'+pickupQuery;
    endpoints.push(url);
  }

  const session=blibliSession_(referer);
  let best={price:'',currency:'',pickupPointCode:pickupPointCode,description:'',variants:[],originalPrice:'',discountPercent:'',soldText:'',specifications:[],brand:'',category:'',fetchDiagnostics:session.diagnostics};

  for(let i=0;i<endpoints.length;i++){
    const payload=fetchJsonSession_(endpoints[i],referer,session)||fetchJsonFast_(endpoints[i],referer);
    if(!payload)continue;
    const data=payload.data||payload;
    const commerce=extractSummaryCommerce_(data);

    if(commerce.description.length>best.description.length)best.description=commerce.description;
    if(commerce.variants.length>best.variants.length)best.variants=commerce.variants;
    if(commerce.specifications.length>best.specifications.length)best.specifications=commerce.specifications;
    if(commerce.originalPrice)best.originalPrice=commerce.originalPrice;
    if(commerce.discountPercent)best.discountPercent=commerce.discountPercent;
    if(commerce.soldText)best.soldText=commerce.soldText;
    if(commerce.brand)best.brand=commerce.brand;
    if(commerce.category)best.category=commerce.category;
    if(commerce.price){
      best.price=commerce.price;
      best.currency=commerce.currency||'IDR';
    }
  }
  best.fetchDiagnostics=(session.diagnostics||[]).slice(-12);
  return best;
}
function summaryData_(canonical,id,contextUrl,sessionArg){
  let pickupPointCode='';
  try{
    pickupPointCode=parseHttpUrl_(String(contextUrl||canonical)).searchParams.get('pickupPointCode')||'';
  }catch(e){}

  const itemSuffix=pickupPointCode?'?pickupPointCode='+encodeURIComponent(pickupPointCode):'';
  const endpoints=['https://www.blibli.com/backend/product-detail/products/is--'+encodeURIComponent(id)+'/_summary'+itemSuffix];

  const productSku=id.replace(/-\d{5}$/,'');
  if(productSku!==id){
    let productUrl='https://www.blibli.com/backend/product-detail/products/ps--'+encodeURIComponent(productSku)+'/_summary?defaultItemSku='+encodeURIComponent(id)+'&cnc=false';
    if(pickupPointCode)productUrl+='&pickupPointCode='+encodeURIComponent(pickupPointCode);
    endpoints.push(productUrl);
  }

  const session=sessionArg||blibliSession_(contextUrl||canonical);
  let title='',images=[],price='',currency='',description='',variants=[],originalPrice='',discountPercent='',soldText='',specifications=[],brand='',category='';

  endpoints.forEach(function(u){
    const j=fetchJsonSession_(u,canonical,session)||fetchJson_(u,canonical);
    if(!j)return;
    const data=j.data||j;
    if(data&&data.name)title=String(data.name);

    const productCode=data&&typeof data.productCode==='string'?String(data.productCode):'';
    let current=collectSummaryImages_(data,canonical);
    if(/^MTA-\d+$/i.test(productCode)){
      const exact=current.filter(function(src){return src.toUpperCase().indexOf(productCode.toUpperCase())>=0});
      if(exact.length)current=exact;
    }
    images=images.concat(current);

    const commerce=extractSummaryCommerce_(data);
    if(commerce.price){price=commerce.price;currency=commerce.currency||currency||'IDR'}
    if(commerce.description.length>description.length)description=commerce.description;
    if(commerce.variants.length>variants.length)variants=commerce.variants;
    if(commerce.specifications.length>specifications.length)specifications=commerce.specifications;
    if(commerce.originalPrice)originalPrice=commerce.originalPrice;
    if(commerce.discountPercent)discountPercent=commerce.discountPercent;
    if(commerce.soldText)soldText=commerce.soldText;
    if(commerce.brand)brand=commerce.brand;
    if(commerce.category)category=commerce.category;
  });

  const ranked=rankProductImages_(images,id);
  return {
    title:title,
    images:dominantBlibliGallery_(ranked),
    price:price,
    currency:currency,
    description:description,
    variants:variants,
    originalPrice:originalPrice,
    discountPercent:discountPercent,
    soldText:soldText,
    specifications:specifications,
    brand:brand,
    category:category,
    fetchDiagnostics:(session.diagnostics||[]).slice(-12)
  };
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
    uniquesellingpoint:170,
    productstory:165,
    productdescription:160,
    description:150,
    shortdescription:145,
    longdescription:145,
    productdetail:135,
    productdetails:135,
    overview:120,
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

function cleanInlineText_(value){
  return decodeHtml_(value||'')
    .replace(/<!---->/g,' ')
    .replace(/<script[\s\S]*?<\/script>/ig,' ')
    .replace(/<style[\s\S]*?<\/style>/ig,' ')
    .replace(/<br\s*\/?>/ig,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/ig,' ')
    .replace(/&#39;|&apos;/ig,"'")
    .replace(/&quot;/ig,'"')
    .replace(/\s+/g,' ')
    .trim();
}
function cleanSoldText_(value){
  const text=cleanInlineText_(value);
  if(!text)return '';
  if(/^terjual\b/i.test(text))return text.slice(0,80);
  if(/^[0-9][0-9.,]*\s*(?:rb|ribu|jt|juta)?$/i.test(text))return 'Terjual '+text;
  return text.slice(0,80);
}
function normalizeDiscountPercent_(value){
  const m=String(value||'').match(/([0-9]{1,3})\s*%?/);
  if(!m)return '';
  const n=Number(m[1]);
  return isFinite(n)&&n>=0&&n<=100?String(n)+'%':'';
}
function normalizeSpecifications_(value){
  const out=[],seen={};
  function add(label,val){
    const l=cleanInlineText_(label).replace(/:\s*$/,'').trim();
    const v=cleanInlineText_(val);
    if(!l||!v||l.length>100||v.length>1000)return;
    const key=l.toLowerCase();
    if(seen[key])return;
    seen[key]=true;
    out.push({label:l,value:v});
  }
  if(Array.isArray(value)){
    value.forEach(function(row){
      if(!row)return;
      if(typeof row==='object')add(row.label||row.name||row.key,row.value||row.text||row.val);
    });
  }else if(value&&typeof value==='object'){
    Object.keys(value).forEach(function(key){add(key,value[key])});
  }
  return out.slice(0,80);
}
function specValue_(specifications,label){
  const wanted=String(label||'').toLowerCase();
  const row=(specifications||[]).find(function(x){return String(x&&x.label||'').toLowerCase()===wanted});
  return row?String(row.value||''):'';
}
function sectionBetween_(html,startNeedles,stopNeedles){
  const value=String(html||'');
  let start=-1;
  (startNeedles||[]).some(function(needle){
    const i=value.indexOf(needle);
    if(i>=0){start=i;return true}
    return false;
  });
  if(start<0)return '';
  const tagStart=value.lastIndexOf('<',start);
  if(tagStart>=0)start=tagStart;
  let end=value.length;
  (stopNeedles||[]).forEach(function(needle){
    const i=value.indexOf(needle,start+1);
    if(i>=0&&i<end){
      const tag=value.lastIndexOf('<',i);
      end=tag>=start?tag:i;
    }
  });
  return value.slice(start,end);
}
function extractBlibliDomData_(html){
  const value=decodeHtml_(html||'');
  const data={price:'',originalPrice:'',discountPercent:'',soldText:'',description:'',variants:[],specifications:[],brand:'',category:''};

  data.price=normalizePrice_(pick_(value,[
    /data-testid=["']priceComponentOffered["'][^>]*>\s*Rp\s*([0-9][0-9.,]*)/i,
    /class=["'][^"']*product-price__after[^"']*["'][^>]*>\s*Rp\s*([0-9][0-9.,]*)/i
  ]));
  data.originalPrice=normalizePrice_(pick_(value,[
    /class=["'][^"']*product-price__before[^"']*["'][^>]*>\s*Rp\s*([0-9][0-9.,]*)/i
  ]));
  data.discountPercent=normalizeDiscountPercent_(pick_(value,[
    /class=["'][^"']*blu-badge[^"']*b-red[^"']*["'][^>]*>[\s\S]{0,260}?<span[^>]*>\s*([0-9]{1,3})\s*%/i
  ]));
  data.soldText=cleanSoldText_(pick_(value,[
    /class=["'][^"']*sold-seen-label__label[^"']*["'][^>]*>\s*([^<]{1,80})\s*</i
  ]));

  const descriptionBlock=sectionBetween_(value,['product-description-section'],['product-specification','data-testid="variantSection"','pdp__variant']);
  if(descriptionBlock){
    data.description=cleanDescription_(descriptionBlock)
      .replace(/^Deskripsi\s*/i,'')
      .trim();
  }

  const variantBlock=sectionBetween_(value,['data-testid="variantSection"','pdp__variant'],['product-description-section','product-specification']);
  if(variantBlock){
    let groupName=cleanInlineText_(pick_(variantBlock,[
      /class=["'][^"']*\blabel\b[^"']*["'][^>]*>\s*([^<:]{1,80})\s*:/i
    ]))||'Varian';
    const selectedText=cleanInlineText_(pick_(variantBlock,[
      /class=["'][^"']*\blabel\b[^"']*["'][^>]*>[\s\S]{0,120}?<\/span>\s*<span[^>]*>\s*([^<]{1,100})\s*<\/span>/i
    ]));
    const options=[];
    const chipRe=/<div[^>]+class=["']([^"']*product-chip[^"']*product-variant__item[^"']*)["'][^>]+data-testid=["']colorVariantImage-\d+["'][^>]*>[\s\S]*?<img([^>]*)>[\s\S]*?<div[^>]+class=["'][^"']*product-chip__desc[^"']*["'][^>]*>([^<]{1,100})<\/div>/ig;
    let chip;
    while((chip=chipRe.exec(variantBlock))){
      const classes=String(chip[1]||'');
      const attrs=String(chip[2]||'');
      const desc=cleanInlineText_(chip[3]);
      const alt=cleanInlineText_(pick_(attrs,[/\balt=["']([^"']+)["']/i]));
      const src=normalizeImage_(pick_(attrs,[/\b(?:data-src|src)=["']([^"']+)["']/i]));
      const name=desc||alt;
      if(name)options.push({name:name,image:src,selected:/\bd-selected\b/i.test(classes),outOfStock:/\bd-oos\b/i.test(classes)});
    }
    if(options.length){
      const selectedOption=options.find(function(x){return x.selected});
      data.variants.push({name:groupName,selected:selectedOption?selectedOption.name:selectedText,values:options});
    }else if(selectedText){
      data.variants.push({name:groupName,selected:selectedText,values:[{name:selectedText,selected:true,outOfStock:false,image:''}]});
    }

    const code=cleanInlineText_(pick_(variantBlock,[
      /class=["'][^"']*\blabel\b[^"']*["'][^>]*>\s*Kode Produk:\s*<\/span>[\s\S]{0,900}?<abbr[^>]*>([^<]{1,100})<\/abbr>/i
    ]));
    if(code)data.variants.push({name:'Kode Produk',selected:code,values:[{name:code,selected:true,outOfStock:false,image:''}]});
  }

  const specBlock=sectionBetween_(value,['product-specification'],['product-description-section','data-testid="review','recommendation','similar-product']);
  if(specBlock){
    const rows=[];
    const rowRe=/<tr[^>]*>([\s\S]*?)<\/tr>/ig;
    let row;
    while((row=rowRe.exec(specBlock))){
      const body=row[1];
      const label=cleanInlineText_(pick_(body,[
        /class=["'][^"']*\blabel\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
      ]));
      let val=cleanInlineText_(pick_(body,[
        /class=["'][^"']*\bvalue\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
        /class=["'][^"']*more-specs__label[^"']*["'][^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i
      ]));
      if(label&&val)rows.push({label:label,value:val});
    }
    if(/Jaminan stok tersedia/i.test(cleanInlineText_(specBlock)))rows.push({label:'Stok',value:'Jaminan stok tersedia'});
    data.specifications=normalizeSpecifications_(rows);
    data.category=specValue_(data.specifications,'Kategori');
    data.brand=specValue_(data.specifications,'Merk');
  }

  return data;
}

function normalizeVariants_(value){
  const groups=[];
  const seen={};

  function option(v){
    if(v===null||v===undefined)return null;
    if(typeof v==='string'||typeof v==='number'){
      const name=String(v).replace(/\s+/g,' ').trim();
      return name?{name:name,image:'',selected:false,outOfStock:false}:null;
    }
    if(typeof v!=='object')return null;
    const name=String(v.name||v.label||v.value||v.text||v.displayName||'').replace(/\s+/g,' ').trim();
    if(!name)return null;
    return {
      name:name,
      image:normalizeImage_(v.image||v.imageUrl||v.thumbnail||v.thumbnailUrl||''),
      selected:!!(v.selected||v.isSelected),
      outOfStock:!!(v.outOfStock||v.oos||v.disabled||v.available===false)
    };
  }

  function add(name,values,selected){
    const label=String(name||'Varian').replace(/\s+/g,' ').trim();
    const list=[];
    const optionSeen={};
    (values||[]).forEach(function(v){
      const o=option(v);
      if(!o||o.name.length>80||/^(pilih|select|varian|variant|warna|color)$/i.test(o.name))return;
      const key=o.name.toLowerCase();
      if(optionSeen[key]){
        const existing=list.find(function(x){return x.name.toLowerCase()===key});
        if(existing){
          existing.selected=existing.selected||o.selected;
          existing.outOfStock=existing.outOfStock&&o.outOfStock;
          if(!existing.image&&o.image)existing.image=o.image;
        }
        return;
      }
      optionSeen[key]=true;
      list.push(o);
    });
    if(!list.length)return;

    const key=label.toLowerCase();
    const selectedName=String(selected||'').trim()||(list.find(function(x){return x.selected})||{}).name||'';
    if(!seen[key]){
      seen[key]=true;
      groups.push({name:label,selected:selectedName,values:list.slice(0,30)});
    }else{
      const existing=groups.find(function(g){return g.name.toLowerCase()===key});
      if(existing){
        const merged=existing.values.concat(list);
        const dedup=[];
        const keys={};
        merged.forEach(function(o){
          const k=o.name.toLowerCase();
          if(keys[k])return;
          keys[k]=true;dedup.push(o);
        });
        existing.values=dedup.slice(0,30);
        if(!existing.selected&&selectedName)existing.selected=selectedName;
      }
    }
  }

  if(Array.isArray(value)){
    value.forEach(function(group){
      if(!group)return;
      if(typeof group==='string'||typeof group==='number')add('Varian',[group],'');
      else if(typeof group==='object')add(group.name||group.label||group.type||group.attributeName||'Varian',group.values||group.options||group.items||group.variants||[],group.selected||group.selectedValue||'');
    });
  }

  return groups.slice(0,12);
}
function extractSummaryVariants_(value){
  const groups=[];
  const byName={};

  function add(name,rawValue){
    const label=String(name||'Varian').replace(/\s+/g,' ').trim();
    const val=String(rawValue||'').replace(/\s+/g,' ').trim();
    if(!label||!val||val.length>100)return;
    const key=label.toLowerCase();
    if(!byName[key]){
      byName[key]={name:label,values:[]};
      groups.push(byName[key]);
    }
    if(byName[key].values.indexOf(val)<0)byName[key].values.push(val);
  }

  function consumeAttribute(attr){
    if(!attr||typeof attr!=='object')return;
    const name=attr.name||attr.label||attr.attributeName||attr.variantName||'Varian';

    if(attr.value!==undefined&&attr.value!==null&&typeof attr.value!=='object'){
      add(name,attr.value);
    }

    const values=attr.values||attr.variantValues||attr.items;
    if(Array.isArray(values)){
      values.forEach(function(item){
        if(item===null||item===undefined)return;
        if(typeof item==='string'||typeof item==='number')add(name,item);
        else if(typeof item==='object')add(name,item.value||item.name||item.label||item.text||item.displayName||'');
      });
    }
  }

  function visit(node,keyHint){
    if(!node)return;

    if(Array.isArray(node)){
      if(/attributes?/i.test(String(keyHint||''))){
        node.forEach(consumeAttribute);
      }
      node.forEach(function(item){visit(item,keyHint)});
      return;
    }

    if(typeof node!=='object')return;

    // Direct Blibli attribute object: {name:"Warna", value:"Black"}.
    if((node.name||node.attributeName)&&(node.value!==undefined||Array.isArray(node.values))){
      consumeAttribute(node);
    }

    // Direct Blibli option: {attributes:[{name,value}], ...}.
    if(Array.isArray(node.attributes)){
      node.attributes.forEach(consumeAttribute);
    }

    Object.keys(node).forEach(function(key){
      const child=node[key];

      if(/^(color|colour|warna|size|ukuran|capacity|kapasitas|storage|memory|ram)$/i.test(key)){
        if(Array.isArray(child)){
          child.forEach(function(item){
            if(typeof item==='string'||typeof item==='number')add(key,item);
            else if(item&&typeof item==='object')add(key,item.value||item.name||item.label||'');
          });
        }else if(typeof child==='string'||typeof child==='number'){
          add(key,child);
        }
      }

      if(child&&typeof child==='object')visit(child,key);
    });
  }

  visit(value,'');
  return normalizeVariants_(groups);
}
function htmlToVisibleText_(html){
  return decodeHtml_(html||'')
    .replace(/<script[\s\S]*?<\/script>/ig,' ')
    .replace(/<style[\s\S]*?<\/style>/ig,' ')
    .replace(/<(?:br|\/p|\/div|\/li|\/button|\/section|\/h[1-6]|\/span)>/ig,'\n')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/ig,' ')
    .replace(/&#39;|&apos;/ig,"'")
    .replace(/&quot;/ig,'"')
    .replace(/\r/g,'')
    .replace(/[ \t]+/g,' ')
    .replace(/\n[ \t]+/g,'\n')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}
function extractSeoDescription_(html,title){
  const value=decodeHtml_(html||'');

  const serialized=pick_(value,[
    /"uniqueSellingPoint"\s*:\s*"((?:\\.|[^"\\]){20,5000})"/i,
    /"productStory"\s*:\s*"((?:\\.|[^"\\]){20,5000})"/i,
    /"productDescription"\s*:\s*"((?:\\.|[^"\\]){20,5000})"/i,
    /"description"\s*:\s*"((?:\\.|[^"\\]){20,5000})"/i
  ]);
  const serializedClean=cleanDescription_(serialized);
  if(serializedClean&&!/online mall|belanja online/i.test(serializedClean))return serializedClean;

  const text=htmlToVisibleText_(value);
  const lower=text.toLowerCase();
  let start=lower.indexOf('deskripsi produk');
  if(start<0)start=lower.indexOf('deskripsi');
  if(start<0)return '';

  let block=text.slice(start);
  const stopCandidates=['\nspesifikasi','\nulasan','\ndijual oleh','\nproduk serupa'];
  let stop=block.length;
  stopCandidates.forEach(function(marker){
    const i=block.toLowerCase().indexOf(marker);
    if(i>20&&i<stop)stop=i;
  });
  block=block.slice(0,stop)
    .replace(/^deskripsi produk\s*/i,'')
    .replace(/^deskripsi\s*/i,'')
    .trim();

  if(title){
    const titleIndex=block.toLowerCase().indexOf(String(title).toLowerCase());
    if(titleIndex>=0)block=block.slice(titleIndex+String(title).length).trim();
  }

  block=block
    .replace(/^merk\s*:?\s*[A-Za-z0-9 ._-]+/i,'')
    .replace(/^kategori\s*:?[^\n]+/i,'')
    .trim();

  return cleanDescription_(block);
}
function extractSeoVariants_(html){
  const text=htmlToVisibleText_(html||'');
  const groups=[];

  [
    {name:'Warna',re:/(?:^|\n)warna\s*:\s*([\s\S]{1,600}?)(?=\n(?:kode produk|deskripsi produk|deskripsi|ukuran|size|kapasitas|storage|ram)\s*:|\n\n|$)/i},
    {name:'Ukuran',re:/(?:^|\n)(?:ukuran|size)\s*:\s*([\s\S]{1,400}?)(?=\n(?:kode produk|deskripsi produk|deskripsi|warna|kapasitas|storage|ram)\s*:|\n\n|$)/i},
    {name:'Kapasitas',re:/(?:^|\n)(?:kapasitas|storage)\s*:\s*([\s\S]{1,400}?)(?=\n(?:kode produk|deskripsi produk|deskripsi|warna|ukuran|size|ram)\s*:|\n\n|$)/i}
  ].forEach(function(def){
    const m=text.match(def.re);
    if(!m||!m[1])return;
    let values=m[1].split(/\n|\s{2,}|\s*\|\s*|\s*,\s*/).map(function(v){return v.trim()}).filter(Boolean);

    // If the SEO renderer collapses all colour buttons into one line, split the
    // common multi-word colour names without damaging arbitrary variant labels.
    if(def.name==='Warna'&&values.length===1){
      const one=values[0];
      const known=one.match(/(?:space\s+gr[ae]y|light\s+green|dark\s+blue|light\s+blue|rose\s+gold|midnight\s+blue|tosca|red|blue|green|black|white|gray|grey|pink|purple|yellow|orange|silver|gold)/ig);
      if(known&&known.length>=2)values=known;
    }
    groups.push({name:def.name,values:values});
  });

  // Embedded Blibli state often contains option attributes even when buttons are
  // not rendered into the SEO HTML. Read those name/value pairs as a fallback.
  const serialized=decodeHtml_(html||'');
  const pairRe=/"name"\s*:\s*"(Warna|Color|Colour|Ukuran|Size|Kapasitas|Storage|Memory|RAM)"[\s\S]{0,260}?"value"\s*:\s*"([^"]{1,100})"/ig;
  let match;
  while((match=pairRe.exec(serialized))){
    groups.push({name:match[1],values:[match[2]]});
  }

  return normalizeVariants_(groups);
}
function ampProductPageData_(p){
  const id=String(p&&p.id||'').trim();
  let page=String(p&&p.canonicalUrl||'');
  if(!page)return {price:'',currency:'',description:'',variants:[]};

  try{
    const u=parseHttpUrl_(page);
    if(!/\/p\//i.test(u.pathname))return {price:'',currency:'',description:'',variants:[]};
    if(!/^\/amp\//i.test(u.pathname))u.pathname='/amp'+u.pathname;
    u.search='';
    if(p.pickupPointCode)u.searchParams.set('pickupPointCode',String(p.pickupPointCode));
    page=u.toString();
  }catch(e){
    return {price:'',currency:'',description:'',variants:[]};
  }

  const html=fetchSeoText_(page,id);
  if(!html)return {price:'',currency:'',description:'',variants:[]};

  return {
    price:extractHtmlPrice_(html),
    currency:pick_(html,[
      /<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,
      /"priceCurrency"\s*:\s*"([^"]+)"/i
    ])||'IDR',
    description:extractSeoDescription_(html,p.name||''),
    variants:extractSeoVariants_(html)
  };
}
function seoProductPageData_(p){
  const id=String(p&&p.id||'').trim();
  if(!id)return {price:'',currency:'',description:'',variants:[]};

  const baseId=id.replace(/-\d{5}$/,'');
  let page=String(p.canonicalUrl||'');
  try{
    const u=parseHttpUrl_(page);
    if(/\/is--[^/?#]+$/i.test(u.pathname)){
      u.pathname=u.pathname.replace(/\/is--[^/?#]+$/i,'/ps--'+baseId);
    }else if(!/\/ps--[^/?#]+$/i.test(u.pathname)){
      return {price:'',currency:'',description:'',variants:[]};
    }
    u.search='';
    if(p.pickupPointCode)u.searchParams.set('pickupPointCode',String(p.pickupPointCode));
    page=u.toString();
  }catch(e){
    return {price:'',currency:'',description:'',variants:[]};
  }

  // Use the full UA rotation here, including Googlebot. Blibli's SEO product
  // page contains price, description and selectable variants even when the
  // application JSON endpoint blocks server-side requests.
  const html=fetchSeoText_(page,p&&p.id||'');
  if(!html)return {price:'',currency:'',description:'',variants:[]};

  return {
    price:extractHtmlPrice_(html),
    currency:pick_(html,[/<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,/"priceCurrency"\s*:\s*"([^"]+)"/i])||'IDR',
    description:extractSeoDescription_(html,p.name||''),
    variants:extractSeoVariants_(html)
  };
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
    // Blibli product-detail _summary commonly exposes the visible sell price as
    // data.price.listed. Prefer that exact field before generic fallbacks.
    listed:160,
    listedprice:158,
    finalprice:150,
    saleprice:145,
    sellingprice:142,
    offerprice:140,
    discountedprice:138,
    currentprice:136,
    itemprice:134,
    price:120,
    minprice:90,
    originalprice:25,
    strikeprice:20,
    strikethroughprice:20
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
    /"(?:listed|listedPrice|finalPrice|salePrice|sellingPrice|offerPrice|discountedPrice|currentPrice|itemPrice|price)"\s*:\s*"?([0-9][0-9.,]*)"?/i,
    /"(?:formattedPrice|formattedValue|displayPrice|priceDisplay)"\s*:\s*"Rp\s*([0-9][0-9.,]*)"/i,
    /"amount"\s*:\s*"?([0-9][0-9.,]*)"?\s*,\s*"currency"\s*:\s*"IDR"/i
  ]);
  return {price:normalizePrice_(raw),currency:raw?'IDR':''};
}
function extractHtmlPrice_(html){
  const value=decodeHtml_(html||'');
  let raw=pick_(value,[
    /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
    /"(?:listed|listedPrice|finalPrice|salePrice|sellingPrice|offerPrice|discountedPrice|currentPrice|itemPrice)"\s*:\s*"?([0-9][0-9.,]*)"?/i,
    /"(?:formattedPrice|formattedValue|displayPrice|priceDisplay)"\s*:\s*"Rp\s*([0-9][0-9.,]*)"/i,
    /Rp(?:&nbsp;|\s|<[^>]+>)*([0-9]{1,3}(?:[.\s][0-9]{3})+(?:,[0-9]{1,2})?|[0-9]{4,})/i
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
    const payload=fetchJsonFast_(endpoint,referer||'https://www.blibli.com/');
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

  // Fast path: exact SKU _summary. This avoids searching the full Blibli
  // catalogue and reads the same price object used by the product page.
  const summaryPriceData=fastSummaryPrice_(p);
  let priceData=summaryPriceData;
  const recoveredPickupPointCode=String(summaryPriceData.pickupPointCode||p.pickupPointCode||'').trim();
  if(recoveredPickupPointCode&&!p.pickupPointCode)p=Object.assign({},p,{pickupPointCode:recoveredPickupPointCode});

  let priceSource=priceData.price?'summary':'';
  let bestDescription=cleanDescription_(priceData.description||p.description||'');
  let bestVariants=normalizeVariants_((priceData.variants&&priceData.variants.length?priceData.variants:p.variants)||[]);

  const seoData=seoProductPageData_(p);
  if(seoData.description&&seoData.description.length>bestDescription.length)bestDescription=cleanDescription_(seoData.description);
  if(seoData.variants&&seoData.variants.length>bestVariants.length)bestVariants=normalizeVariants_(seoData.variants);

  if(!priceData.price&&seoData.price){
    priceData={price:seoData.price,currency:seoData.currency||'IDR'};
    priceSource='seo-page';
  }

  const ampData=ampProductPageData_(p);
  if(ampData.description&&ampData.description.length>bestDescription.length)bestDescription=cleanDescription_(ampData.description);
  if(ampData.variants&&ampData.variants.length>bestVariants.length)bestVariants=normalizeVariants_(ampData.variants);
  if(!priceData.price&&ampData.price){
    priceData={price:ampData.price,currency:ampData.currency||'IDR'};
    priceSource='amp-page';
  }

  // Blibli's selected-variant page remains a second fallback.
  if(!priceData.price){
    priceData=selectedVariantPagePrice_(p);
    if(priceData.price)priceSource='variant-page';
  }

  // Search API is only a fallback and still requires an exact/base SKU match.
  if(!priceData.price){
    priceData=searchPriceData_(p.id,p.name,p.canonicalUrl||p.affiliateUrl);
    if(priceData.price)priceSource='search';
  }

  // Final fallback: direct PDP HTML.
  if(!priceData.price){
    const html=fetchSeoText_(p.canonicalUrl||p.affiliateUrl,p.id);
    priceData={
      price:extractHtmlPrice_(html),
      currency:pick_(html,[/<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,/"priceCurrency"\s*:\s*"([^"]+)"/i])||''
    };
    if(priceData.price)priceSource='pdp';
  }

  const readerNeeded=!priceData.price||!bestDescription||!bestVariants.length||
    !cleanSoldText_(p.soldText||'')||!normalizeSpecifications_(p.specifications||[]).length;
  const readerData=readerNeeded?readerProductData_(p):emptyReaderData_();
  if(!priceData.price&&readerData.price){
    priceData={price:readerData.price,currency:readerData.currency||'IDR'};
    priceSource='reader';
  }
  if(readerData.description&&readerData.description.length>bestDescription.length)bestDescription=cleanDescription_(readerData.description);
  if(readerData.variants&&readerData.variants.length>bestVariants.length)bestVariants=normalizeVariants_(readerData.variants);

  let richDom={price:'',originalPrice:'',discountPercent:'',soldText:'',description:'',variants:[],specifications:[]};
  if(!cleanSoldText_(p.soldText||'')||!normalizeSpecifications_(p.specifications||[]).length||!bestDescription||!bestVariants.length){
    const richHtml=fetchSeoText_(p.canonicalUrl||p.affiliateUrl,p.id);
    if(richHtml)richDom=extractBlibliDomData_(richHtml);
  }
  if(richDom.description&&richDom.description.length>bestDescription.length)bestDescription=cleanDescription_(richDom.description);
  if(richDom.variants&&richDom.variants.length>bestVariants.length)bestVariants=normalizeVariants_(richDom.variants);
  const price=normalizePrice_(priceData.price||richDom.price);
  const description=bestDescription;
  const variants=bestVariants;
  const soldText=cleanSoldText_(richDom.soldText||summaryPriceData.soldText||readerData.soldText||p.soldText||'');
  const originalPrice=normalizePrice_(richDom.originalPrice||summaryPriceData.originalPrice||readerData.originalPrice||p.originalPrice||'');
  const discountPercent=normalizeDiscountPercent_(richDom.discountPercent||summaryPriceData.discountPercent||readerData.discountPercent||p.discountPercent||'');
  const specifications=normalizeSpecifications_((richDom.specifications&&richDom.specifications.length?richDom.specifications:(summaryPriceData.specifications&&summaryPriceData.specifications.length?summaryPriceData.specifications:(readerData.specifications&&readerData.specifications.length?readerData.specifications:p.specifications)))||[]);
  const brand=richDom.brand||summaryPriceData.brand||readerData.brand||specValue_(specifications,'Merk')||p.brand||'';
  const category=richDom.category||summaryPriceData.category||readerData.category||specValue_(specifications,'Kategori')||p.category||'';
  const fetchDiagnostics=(summaryPriceData.fetchDiagnostics||[]).concat(readerData.readerDiagnostics||[]).join(' | ').slice(0,1200);

  if(!price){
    return Object.assign({},p,{
      description:description||p.description||'',
      variants:variants,
      soldText:soldText,
      originalPrice:originalPrice,
      discountPercent:discountPercent,
      specifications:specifications,
      brand:brand,
      category:category,
      pickupPointCode:recoveredPickupPointCode||p.pickupPointCode||'',
      lastPriceSource:'empty',
      lastFetchDiagnostics:fetchDiagnostics
    });
  }

  return Object.assign({},p,{
    price:price,
    currency:String(priceData.currency||p.currency||'IDR').toUpperCase(),
    description:description||p.description||'',
    variants:variants,
    soldText:soldText,
    originalPrice:originalPrice,
    discountPercent:discountPercent,
    specifications:specifications,
    brand:brand,
    category:category,
    priceUpdatedAt:new Date().toISOString(),
    source:'live-price',
    pickupPointCode:recoveredPickupPointCode||p.pickupPointCode||'',
    lastPriceSource:priceSource||'unknown',
    lastFetchDiagnostics:fetchDiagnostics
  });
}
function publicPrice_(id){
  if(!/^[A-Za-z0-9-]{3,100}$/.test(id))throw new Error('Product ID tidak valid');
  const cached=readProducts_(PUBLISHED_SHEET).find(function(p){return p.id===id});
  if(!cached)throw new Error('Produk tidak ditemukan');
  return {
    ok:true,
    id:id,
    price:cached.price||null,
    currency:cached.currency||null,
    priceUpdatedAt:cached.priceUpdatedAt||null,
    refreshed:false,
    liveFetchDisabled:true
  };
}
function scheduledRefreshPrices(){
  // Kept as a no-op so an old installed trigger cannot make blocked Blibli
  // requests while the next normal API request removes that legacy trigger.
  return {ok:true,disabled:true};
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
    const u=parseHttpUrl_(v);
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
    const u=parseHttpUrl_(String(value||''));
    return (u.origin+u.pathname).replace(/\/$/,'');
  }catch(e){
    return String(value||'').split('?')[0].replace(/\/$/,'');
  }
}
function titleFromUrl_(value){
  try{
    const u=parseHttpUrl_(String(value||''));
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
