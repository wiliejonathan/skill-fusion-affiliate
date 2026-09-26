const SHEET_ID = '1V3LTciKM0AAXQAbdk-1eNk6Ie0aXL_ksvSDBzDVjUI0';
const DRAFT_SHEET = 'Draft';
const PUBLISHED_SHEET = 'Published';
const CONFIG_SHEET = 'Config';
const LOG_SHEET = 'Logs';
const HEADERS = ['sequence','id','canonicalProductId','name','brand','category','images_json','affiliateUrl','canonicalUrl','badge','features_json','price','currency','updatedAt','source'];

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
  const p=reloadFromBlibli_({id:'',name:'',images:[],affiliateUrl:url,canonicalUrl:''});
  if(!p.id||!p.name||!p.images.length)throw new Error('Metadata Blibli belum terbaca. Produk belum disimpan.');
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
    if(existing.some(x=>x.affiliateUrl===p.affiliateUrl&&x.id!==p.id))throw new Error('Link affiliate sudah dipakai produk lain');
    const current=existing.find(x=>x.id===p.id);
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
  const htmlImages=extractBlibliImages_(html);
  let gathered=htmlImages.slice();
  const summary=summaryData_(canonical,id);
  if(summary.title)title=summary.title;
  gathered=gathered.concat(summary.images);
  gathered=unique_(gathered.map(normalizeImage_).filter(Boolean));
  let gallery=bestGallery_(gathered);
  const official=officialImages_(id);
  if(official.length>gallery.length)gallery=official;
  if((p.images||[]).length>gallery.length)gallery=p.images;
  const price=pick_(html,[/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,/"price"\s*:\s*"?([0-9.]+)"?/i])||p.price||'';
  const currency=pick_(html,[/<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,/"priceCurrency"\s*:\s*"([^"]+)"/i])||p.currency||'';
  return Object.assign({},p,{id:id,canonicalProductId:id,name:title,brand:inferBrand_(title,id),features:inferFeatures_(title),canonicalUrl:canonical,images:gallery,price:price,currency:currency,source:'blibli-reload'});
}
function resolveUrl_(url){
  let current=url,html='';
  for(let i=0;i<6;i++){
    validBlibliUrl_(current);
    const r=UrlFetchApp.fetch(current,{followRedirects:false,muteHttpExceptions:true,headers:{Accept:'text/html,application/xhtml+xml','Accept-Language':'id-ID,id;q=0.9,en;q=0.8'}});
    const code=r.getResponseCode(),h=r.getAllHeaders(),loc=h.Location||h.location;
    if(code>=300&&code<400&&loc){current=absoluteUrl_(current,String(loc));continue}
    html=r.getContentText();
    break;
  }
  const c=pick_(html,[/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i]);
  return {finalUrl:current,canonical:c||current};
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
function fetchText_(url){try{return UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true,headers:{Accept:'text/html,application/xhtml+xml','Accept-Language':'id-ID,id;q=0.9,en;q=0.8'}}).getContentText()}catch(e){return ''}}
function fetchJson_(url,referer){try{const r=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true,headers:{Accept:'application/json,text/plain,*/*',Referer:referer||''}});if(r.getResponseCode()<200||r.getResponseCode()>=300)return null;return JSON.parse(r.getContentText())}catch(e){return null}}
function summaryData_(canonical,id){
  const endpoints=['https://www.blibli.com/backend/product-detail/products/is--'+encodeURIComponent(id)+'/_summary'];
  const productSku=id.replace(/-\d{5}$/,'');if(productSku!==id)endpoints.push('https://www.blibli.com/backend/product-detail/products/ps--'+encodeURIComponent(productSku)+'/_summary?defaultItemSku='+encodeURIComponent(id)+'&cnc=false');
  let title='',images=[];
  endpoints.forEach(u=>{const j=fetchJson_(u,canonical);if(!j)return;const data=j.data||j;if(data&&data.name)title=String(data.name);images=images.concat(extractBlibliImages_(JSON.stringify(data)))});
  return {title:title,images:unique_(images)};
}
function normalizeImage_(s){if(!s)return '';return String(s).replace(/\\u002F/ig,'/').replace(/\\u003A/ig,':').replace(/\\u0026/ig,'&').replace(/\\\//g,'/').replace(/^\/\//,'https://').replace(/^http:\/\//i,'https://').replace('/images/catalog/thumbnail/','/images/catalog/full/')}
function extractBlibliImages_(text){const n=String(text||'').replace(/\\u002F/ig,'/').replace(/\\u003A/ig,':').replace(/\\u0026/ig,'&').replace(/\\\//g,'/');const m=n.match(/(?:https?:)?\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\/[^"'\\\s<>]+/ig)||[];return unique_(m.map(normalizeImage_))}
function bestGallery_(images){
  const groups={};images.forEach(src=>{const m=String(src).match(/MTA-\d+/i);if(!m)return;const k=m[0].toUpperCase();groups[k]=groups[k]||[];if(groups[k].indexOf(src)<0)groups[k].push(src)});
  const keys=Object.keys(groups).sort((a,b)=>groups[b].length-groups[a].length);return keys.length?groups[keys[0]].slice(0,40):unique_(images).slice(0,40)
}
function officialImages_(id){
  const urls={
    'XIO-60022-01141-00001':'https://www.mi.co.id/id/product/xiaomi-6a-type-a-to-type-c-cable/',
    'ACO-60021-00234-00001':'https://acmic.id/products/acmic-pdc100-power-delivery-pd-100cm-cable-usb-type-c-to-usb-type-c',
    'ACO-60021-00122-00005':'https://acmic.id/products/acmic-cfc100-kabel-data-charger-usb-type-c-100cm-fast-charging-cable'
  };
  if(!urls[id])return [];const h=fetchText_(urls[id]).replace(/\\u0026/ig,'&');const regex=/https:\/\/(?:acmic\.id\/cdn\/shop\/files|cdn\.shopify\.com\/s\/files|i02\.appmifile\.com)\/[^"'\\\s<>]+/ig;return unique_(h.match(regex)||[]).slice(0,30)
}
function productId_(url){const m=String(url||'').match(/\/is--([^/?#]+)/i);return m?m[1]:''}
function pick_(text,patterns){for(let i=0;i<patterns.length;i++){const m=String(text||'').match(patterns[i]);if(m&&m[1])return String(m[1]).replace(/&amp;/g,'&').trim()}return ''}
function unique_(arr){return Array.from(new Set((arr||[]).filter(Boolean)))}
function inferBrand_(title,id){const u=String(title||'').toUpperCase();if(u.indexOf('XIAOMI')===0||String(id).indexOf('XIO-')===0)return 'XIAOMI';if(u.indexOf('ACMIC')===0||String(id).indexOf('ACO-')===0)return 'ACMIC';return String(title||'TECH').split(/\s+/)[0].toUpperCase()}
function inferFeatures_(title){const v=String(title||'').toLowerCase(),f=[];if(/100\s*cm/.test(v))f.push('100 cm');if(/type\s*-?\s*c|usb\s*c/.test(v))f.push('USB Type-C');if(/power delivery|\bpd\b/.test(v))f.push('Power Delivery');else if(/fast\s*charging|6a/.test(v))f.push('Fast charging');return f.length?f:['Blibli Affiliate']}
