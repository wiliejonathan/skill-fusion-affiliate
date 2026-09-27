import {NextRequest,NextResponse} from "next/server";

const UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/143 Safari/537.36";

function pick(html:string,patterns:RegExp[]){
  for(const p of patterns){
    const m=html.match(p);
    if(m?.[1]) return m[1].replace(/&amp;/g,"&").trim();
  }
  return null;
}

const OFFICIAL_FALLBACK_PAGES:Record<string,string>={
  "ACO-60021-00122-00005":"https://acmic.id/products/acmic-cfc100-kabel-data-charger-usb-type-c-100cm-fast-charging-cable",
  "ACO-60021-00234-00001":"https://acmic.id/products/acmic-pdc100-power-delivery-pd-100cm-cable-usb-type-c-to-usb-type-c",
  "XIO-60022-01141-00001":"https://www.mi.co.id/id/product/xiaomi-6a-type-a-to-type-c-cable/"
};

const KNOWN_IMAGE_GALLERIES:Record<string,string[]>={
  "ACO-60021-00122-00005":[
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full02_r5kwu2kd.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full03_lksk36kw.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full01_qypmsyee.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full04_pyp47xtt.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full05_d1dlpkjc.jpg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full06_mpxrk7fj.jpg",
    "https://acmic.id/cdn/shop/files/FLEXYLINE_GambarUtamaCFC_1080x.jpg?v=1698295560",
    "https://acmic.id/cdn/shop/files/CABLE_FLEXYLINE_7b17bc56-50db-4378-9bd0-c004ca8d6e89_1080x.jpg?v=1698295560"
  ],
  "ACO-60021-00070-00001":[
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full14_ge6ro4m0.jpeg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full15_frg35cse.png",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full16_t0oy1nvi.png",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full17_c2fy0i99.jpeg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full18_tj420zxl.jpeg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full19_grw1dvf1.jpeg",
    "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full20_vabiy15q.jpeg"
  ]
};

function normalizeHtmlForImages(html:string){
  return html
    .replace(/\\u002F/gi,"/")
    .replace(/\\u003A/gi,":")
    .replace(/\\u0026/gi,"&")
    .replace(/\\\//g,"/")
    .replace(/&amp;/g,"&")
    .replace(/&quot;/g,'"');
}

function normalizeCatalogImageUrl(src:string){
  let value=normalizeHtmlForImages(src.trim());
  if(value.startsWith("//")) value="https:"+value;
  if(value.startsWith("www.static-src.com/")) value="https://"+value;
  value=value.replace(/^http:\/\//i,"https://");
  value=value.replace(/\/images\/catalog\/thumbnail\//i,"/images/catalog/full/");
  return value;
}

function isBlibliCatalogImage(src:string){
  return /^https:\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\/full\//i.test(src);
}

function extractStaticImages(html:string){
  const normalized=normalizeHtmlForImages(html);
  const matches=normalized.match(/(?:https?:)?\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\/[^"'\\\s<>]+/gi)||[];
  return [...new Set(
    matches
      .map(normalizeCatalogImageUrl)
      .filter(isBlibliCatalogImage)
  )].slice(0,60);
}

function extractOfficialShopImages(html:string){
  const normalized=normalizeHtmlForImages(html);
  const matches=[
    ...(normalized.match(/https:\/\/acmic\.id\/cdn\/shop\/files\/[^"'\\\s<>]+/gi)||[]),
    ...(normalized.match(/https:\/\/cdn\.shopify\.com\/s\/files\/[^"'\\\s<>]+/gi)||[]),
    ...(normalized.match(/https:\/\/i02\.appmifile\.com\/[^"'\\\s<>]+/gi)||[])
  ];
  return [...new Set(matches)]
    .map(src=>src.replace(/\\u0026/gi,"&"))
    .filter(src=>!/[?&](?:width|height)=\d{1,3}(?:&|$)/i.test(src))
    .slice(0,12);
}

async function fetchOfficialFallbackImages(productId:string|null){
  if(!productId) return [] as string[];
  const page=OFFICIAL_FALLBACK_PAGES[productId];
  if(!page) return [] as string[];
  try{
    const res=await fetch(page,{
      redirect:"follow",
      cache:"no-store",
      headers:{
        "user-agent":UA,
        "accept":"text/html,application/xhtml+xml",
        "accept-language":"id-ID,id;q=0.9,en;q=0.8"
      }
    });
    if(!res.ok) return [];
    const html=await res.text();
    const og=pick(html,[/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i]);
    const all=[og,...extractOfficialShopImages(html)].filter((x):x is string=>Boolean(x));
    return [...new Set(all)].slice(0,12);
  }catch{
    return [];
  }
}

function productBaseId(productId:string|null){
  if(!productId) return null;
  const parts=productId.split("-");
  return parts.length>=3?parts.slice(0,3).join("-"):productId;
}

function slugFromUrl(value:string){
  try{
    const u=new URL(value);
    const marker=u.pathname.includes("/is--")?"/is--":(u.pathname.includes("/ps--")?"/ps--":null);
    const before=marker?u.pathname.slice(0,u.pathname.indexOf(marker)):u.pathname;
    return before.split("/").filter(Boolean).pop()||null;
  }catch{return null}
}


function groupCatalogImagesByAsset(images:string[]){
  const groups=new Map<string,string[]>();
  for(const src of images){
    const asset=src.match(/MTA-\d+/i)?.[0]||"__NO_ASSET__";
    const list=groups.get(asset)||[];
    if(!list.includes(src)) list.push(src);
    groups.set(asset,list);
  }
  return groups;
}

function chooseDominantGallery(images:string[]){
  const groups=[...groupCatalogImagesByAsset(images).entries()]
    .filter(([asset])=>asset!=="__NO_ASSET__")
    .sort((a,b)=>b[1].length-a[1].length);

  if(!groups.length) return [...new Set(images)].slice(0,12);

  const [,best]=groups[0];
  return [...new Set(best)].slice(0,12);
}

function collectBlibliGalleryImages(value:any,productCode:string|null){
  const found:string[]=[];
  const assetCode=productCode&&/^MTA-\d+$/i.test(productCode)?productCode:null;

  function visit(node:any){
    if(typeof node==="string"){
      // Product-summary payloads are not consistent about field names. Instead
      // of trusting keys such as "images", collect every Blibli catalog image
      // URL from the product response and let the MTA asset grouping below
      // isolate the coherent gallery.
      const src=normalizeCatalogImageUrl(node);
      if(!isBlibliCatalogImage(src)) return;
      if(assetCode&&!src.toUpperCase().includes(assetCode.toUpperCase())) return;
      if(!found.includes(src)) found.push(src);
      return;
    }

    if(Array.isArray(node)){
      for(const item of node) visit(item);
      return;
    }

    if(!node||typeof node!=="object") return;
    for(const child of Object.values(node)) visit(child);
  }

  visit(value);
  return found.slice(0,60);
}

function imageFromSummaryItem(item:any){
  if(typeof item==="string") return item;
  return item?.full
    ||item?.original
    ||item?.large
    ||item?.medium
    ||item?.image
    ||item?.url
    ||item?.thumbnail
    ||null;
}

type ProductVariant={name:string;values:string[]};

function normalizePriceValue(value:unknown){
  if(typeof value==="number"&&Number.isFinite(value)&&value>0) return String(Math.round(value));
  const raw=String(value??"").trim().replace(/^Rp\s*/i,"").replace(/\s+/g,"");
  if(!raw) return null;
  if(/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(raw)){
    const n=Number(raw.replace(/\./g,"").replace(",","."));
    return Number.isFinite(n)&&n>0?String(Math.round(n)):null;
  }
  if(/^\d+(?:\.\d+)?$/.test(raw)){
    const n=Number(raw);
    return Number.isFinite(n)&&n>0?String(Math.round(n)):null;
  }
  const digits=raw.replace(/[^0-9]/g,"");
  if(!digits) return null;
  const n=Number(digits);
  return Number.isFinite(n)&&n>0?String(Math.round(n)):null;
}

function cleanProductText(value:unknown){
  return String(value??"")
    .replace(/<script[\s\S]*?<\/script>/gi," ")
    .replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<br\s*\/?>/gi,"\n")
    .replace(/<\/p>|<\/li>|<\/div>/gi,"\n")
    .replace(/<[^>]+>/g," ")
    .replace(/&nbsp;/gi," ")
    .replace(/&amp;/gi,"&")
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/\r/g,"")
    .replace(/[ \t]+/g," ")
    .replace(/\n[ \t]+/g,"\n")
    .replace(/\n{3,}/g,"\n\n")
    .trim()
    .slice(0,5000);
}

function extractSummaryPriceData(value:any){
  const priorities:Record<string,number>={
    listed:200,listedprice:198,finalprice:190,saleprice:185,sellingprice:182,
    offerprice:180,discountedprice:178,currentprice:176,itemprice:174,
    lowprice:160,price:150,minprice:130,originalprice:20,strikeprice:10
  };
  const found:Array<{price:string;score:number}>=[];
  let currency:string|null=null;

  function visit(node:any,keyHint=""){
    if(node===null||node===undefined) return;
    if(typeof node==="string"||typeof node==="number"){
      const key=keyHint.toLowerCase().replace(/[^a-z]/g,"");
      if(key.includes("currency")){
        const cur=String(node).trim().toUpperCase();
        if(/^[A-Z]{3}$/.test(cur)) currency=cur;
      }
      if(Object.prototype.hasOwnProperty.call(priorities,key)){
        const price=normalizePriceValue(node);
        if(price) found.push({price,score:priorities[key]});
      }
      return;
    }
    if(Array.isArray(node)){node.forEach(item=>visit(item,keyHint));return}
    if(typeof node==="object"){
      Object.entries(node).forEach(([key,child])=>visit(child,key));
    }
  }

  visit(value);
  if(!found.length) return {price:null,currency};
  found.sort((a,b)=>b.score-a.score||Number(a.price)-Number(b.price));
  return {price:found[0].price,currency:currency||"IDR"};
}

function extractSummaryDescription(value:any){
  const priorities:Record<string,number>={
    uniquesellingpoint:200,productstory:195,productdescription:190,
    description:180,shortdescription:175,longdescription:175,
    productdetail:165,productdetails:165,overview:150
  };
  const found:Array<{text:string;score:number}>=[];

  function visit(node:any,keyHint=""){
    if(node===null||node===undefined) return;
    if(typeof node==="string"){
      const key=keyHint.toLowerCase().replace(/[^a-z]/g,"");
      const score=priorities[key]||0;
      if(score){
        const text=cleanProductText(node);
        if(text.length>=20) found.push({text,score});
      }
      return;
    }
    if(Array.isArray(node)){node.forEach(item=>visit(item,keyHint));return}
    if(typeof node==="object"){
      Object.entries(node).forEach(([key,child])=>visit(child,key));
    }
  }

  visit(value);
  found.sort((a,b)=>b.score-a.score||b.text.length-a.text.length);
  return found[0]?.text||null;
}

function extractSummaryVariants(value:any):ProductVariant[]{
  const groups=new Map<string,{name:string;values:string[]}>();

  function add(name:unknown,raw:unknown){
    const label=String(name||"Varian").replace(/\s+/g," ").trim();
    const val=String(raw??"").replace(/\s+/g," ").trim();
    if(!label||!val||val.length>100) return;
    if(/^(pilih|select|varian|variant|warna|color)$/i.test(val)) return;
    const key=label.toLowerCase();
    if(!groups.has(key)) groups.set(key,{name:label,values:[]});
    const group=groups.get(key)!;
    if(!group.values.includes(val)) group.values.push(val);
  }

  function consumeAttribute(attr:any){
    if(!attr||typeof attr!=="object") return;
    const name=attr.name||attr.label||attr.attributeName||attr.variantName||"Varian";
    if(attr.value!==undefined&&attr.value!==null&&typeof attr.value!=="object") add(name,attr.value);
    const values=attr.values||attr.variantValues||attr.items;
    if(Array.isArray(values)){
      values.forEach((item:any)=>{
        if(typeof item==="string"||typeof item==="number") add(name,item);
        else if(item&&typeof item==="object") add(name,item.value||item.name||item.label||item.text||item.displayName||"");
      });
    }
  }

  function visit(node:any,keyHint=""){
    if(!node) return;
    if(Array.isArray(node)){
      if(/attributes?/i.test(keyHint)) node.forEach(consumeAttribute);
      node.forEach(item=>visit(item,keyHint));
      return;
    }
    if(typeof node!=="object") return;

    if((node.name||node.attributeName)&&(node.value!==undefined||Array.isArray(node.values))){
      consumeAttribute(node);
    }
    if(Array.isArray(node.attributes)) node.attributes.forEach(consumeAttribute);

    Object.entries(node).forEach(([key,child]:[string,any])=>{
      if(/^(color|colour|warna|size|ukuran|capacity|kapasitas|storage|memory|ram)$/i.test(key)){
        if(Array.isArray(child)){
          child.forEach((item:any)=>{
            if(typeof item==="string"||typeof item==="number") add(key,item);
            else if(item&&typeof item==="object") add(key,item.value||item.name||item.label||"");
          });
        }else if(typeof child==="string"||typeof child==="number"){
          add(key,child);
        }
      }
      if(child&&typeof child==="object") visit(child,key);
    });
  }

  visit(value);
  return [...groups.values()].filter(group=>group.values.length).slice(0,12);
}

function productSkuFromItemSku(productId:string|null){
  if(!productId) return null;
  return productId.replace(/-\d{5}$/,"")||null;
}

async function fetchBlibliSummaryGallery(sourceUrl:string,productId:string|null):Promise<{title:string|null;images:string[];price:string|null;currency:string|null;description:string|null;variants:ProductVariant[]}>{
  if(!productId) return {title:null,images:[],price:null,currency:null,description:null,variants:[]};

  try{
    const source=new URL(sourceUrl);
    const pickupPointCode=source.searchParams.get("pickupPointCode");
    const productSku=productSkuFromItemSku(productId);

    const endpoints:URL[]=[];

    // Item summary: selected SKU / variant.
    const itemEndpoint=new URL(
      "https://www.blibli.com/backend/product-detail/products/is--"+
      encodeURIComponent(productId)+"/_summary"
    );
    if(pickupPointCode) itemEndpoint.searchParams.set("pickupPointCode",pickupPointCode);
    endpoints.push(itemEndpoint);

    // Product summary: Blibli also exposes a product-level endpoint. This is
    // important because some pages only return 1-2 images from the item endpoint,
    // while the product-level response contains the complete media/attribute set.
    if(productSku&&productSku!==productId){
      const productEndpoint=new URL(
        "https://www.blibli.com/backend/product-detail/products/ps--"+
        encodeURIComponent(productSku)+"/_summary"
      );
      productEndpoint.searchParams.set("defaultItemSku",productId);
      productEndpoint.searchParams.set("cnc","false");
      if(pickupPointCode) productEndpoint.searchParams.set("pickupPointCode",pickupPointCode);
      endpoints.push(productEndpoint);
    }

    const userAgents=[
      "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)",
      UA,
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    ];

    let bestTitle:string|null=null;
    let bestPrice:string|null=null;
    let bestCurrency:string|null=null;
    let bestDescription:string|null=null;
    let bestVariants:ProductVariant[]=[];
    const collected:string[]=[];

    for(const endpoint of endpoints){
      for(const ua of userAgents){
        try{
          const res=await fetch(endpoint.toString(),{
            cache:"no-store",
            redirect:"follow",
            headers:{
              "user-agent":ua,
              "accept":"application/json,text/plain,*/*",
              "accept-language":"id-ID,id;q=0.9,en;q=0.8",
              "referer":canonicalProductUrl(sourceUrl),
              "pragma":"no-cache",
              "cache-control":"no-cache"
            }
          });
          if(!res.ok) continue;

          const payload=await res.json();
          const data=payload?.data||payload;
          if(typeof data?.name==="string"&&data.name.trim()) bestTitle=data.name.trim();

          const priceData=extractSummaryPriceData(data);
          if(priceData.price){
            bestPrice=priceData.price;
            bestCurrency=priceData.currency||bestCurrency||"IDR";
          }

          const description=extractSummaryDescription(data);
          if(description&&(!bestDescription||description.length>bestDescription.length)){
            bestDescription=description;
          }

          const variants=extractSummaryVariants(data);
          if(variants.length>bestVariants.length) bestVariants=variants;

          const productCode=typeof data?.productCode==="string"?data.productCode:null;
          const assetCode=productCode&&/^MTA-\d+$/i.test(productCode)?productCode:null;

          const directImages=(Array.isArray(data?.images)?data.images:[])
            .map(imageFromSummaryItem)
            .filter((x:unknown):x is string=>typeof x==="string")
            .map(normalizeCatalogImageUrl)
            .filter(isBlibliCatalogImage)
            .filter((src:string)=>!assetCode||src.toUpperCase().includes(assetCode.toUpperCase()));

          const embeddedImages=collectBlibliGalleryImages(data,productCode);

          for(const src of [...directImages,...embeddedImages]){
            if(!collected.includes(src)) collected.push(src);
          }

          // A complete Blibli product gallery is usually multiple files sharing
          // the same MTA asset. Return early once we already have a healthy set.
          const coherent=chooseDominantGallery(collected);
          if(coherent.length>=8){
            return {title:bestTitle,images:coherent.slice(0,30),price:bestPrice,currency:bestCurrency,description:bestDescription,variants:bestVariants};
          }
        }catch{}
      }
    }

    const coherent=chooseDominantGallery(collected);
    return {title:bestTitle,images:(coherent.length?coherent:collected).slice(0,30),price:bestPrice,currency:bestCurrency,description:bestDescription,variants:bestVariants};
  }catch{
    return {title:null,images:[],price:null,currency:null,description:null,variants:[]};
  }
}

async function fetchBlibliProductSeoGallery(sourceUrl:string,productId:string|null,title:string|null){
  const canonical=canonicalProductUrl(sourceUrl);
  const baseId=productBaseId(productId);
  const userAgents=[
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/143 Mobile Safari/537.36",
    UA
  ];

  const collected:string[]=[];

  for(const ua of userAgents){
    try{
      const res=await fetch(canonical,{
        redirect:"follow",
        cache:"no-store",
        headers:{
          "user-agent":ua,
          "accept":"text/html,application/xhtml+xml",
          "accept-language":"id-ID,id;q=0.9,en;q=0.8",
          "pragma":"no-cache",
          "cache-control":"no-cache"
        }
      });
      if(!res.ok) continue;

      const html=normalizeHtmlForImages(await res.text());
      const candidates=extractStaticImages(html);
      for(const src of candidates){
        if(!collected.includes(src)) collected.push(src);
      }

      // Product gallery images on Blibli share one MTA asset id.
      // Recommendations usually contribute one image each, so the largest
      // same-asset group is the safest product-gallery candidate.
      const dominant=chooseDominantGallery(collected);
      if(dominant.length>=4) return dominant;

      // If the SEO page exposes a concentrated block around the product id/title,
      // inspect that block before falling back to a global dominant group.
      const needles=[productId,baseId,title?.trim()]
        .filter((x):x is string=>Boolean(x));
      for(const needle of needles){
        const lower=html.toLowerCase();
        let idx=lower.indexOf(needle.toLowerCase());
        while(idx>=0){
          const from=Math.max(0,idx-180000);
          const to=Math.min(html.length,idx+180000);
          const near=chooseDominantGallery(extractStaticImages(html.slice(from,to)));
          for(const src of near){
            if(!collected.includes(src)) collected.push(src);
          }
          if(near.length>=4) return near;
          idx=lower.indexOf(needle.toLowerCase(),idx+needle.length);
        }
      }
    }catch{}
  }

  return chooseDominantGallery(collected);
}

async function fetchSeoListingImages(sourceUrl:string,productId:string|null,title:string|null){
  const slug=slugFromUrl(sourceUrl);
  if(!slug) return [] as string[];

  const seoUrl="https://www.blibli.com/jual/"+slug;
  try{
    const res=await fetch(seoUrl,{
      redirect:"follow",
      cache:"no-store",
      headers:{
        "user-agent":UA,
        "accept":"text/html,application/xhtml+xml",
        "accept-language":"id-ID,id;q=0.9,en;q=0.8"
      }
    });
    if(!res.ok) return [];

    const html=normalizeHtmlForImages(await res.text());
    const baseId=productBaseId(productId);
    const needles=[baseId,title?.trim()].filter((x):x is string=>Boolean(x));

    for(const needle of needles){
      const idx=html.toLowerCase().indexOf(needle.toLowerCase());
      if(idx>=0){
        const from=Math.max(0,idx-70000);
        const to=Math.min(html.length,idx+70000);
        const nearby=extractStaticImages(html.slice(from,to));
        if(nearby.length) return nearby.slice(0,8);
      }
    }

    return extractStaticImages(html).slice(0,8);
  }catch{
    return [];
  }
}

function productIdFromUrl(value:string){
  try{
    const u=new URL(value);
    const marker="/is--";
    const i=u.pathname.indexOf(marker);
    if(i<0) return null;
    return u.pathname.slice(i+marker.length).split("/")[0]||null;
  }catch{return null}
}

function canonicalProductUrl(value:string){
  try{
    const u=new URL(value);
    return u.origin+u.pathname.replace(/\/$/,"");
  }catch{return value}
}

function titleFromUrl(value:string){
  try{
    const u=new URL(value);
    const marker="/is--";
    const i=u.pathname.indexOf(marker);
    const before=i>=0?u.pathname.slice(0,i):u.pathname;
    const slug=before.split("/").filter(Boolean).pop()||"Produk Blibli";
    return slug
      .split("-")
      .filter(Boolean)
      .map((part,index)=>{
        if(/^\d/.test(part)||/^[a-z]+\d+$/i.test(part)) return part.toUpperCase();
        return index===0?part.toUpperCase():part;
      })
      .join(" ");
  }catch{return "Produk Blibli"}
}

export async function GET(req:NextRequest){
  const raw=req.nextUrl.searchParams.get("url");
  if(!raw) return NextResponse.json({ok:false,message:"url wajib diisi"},{status:400});

  let current=raw;
  try{
    for(let i=0;i<6;i++){
      const res=await fetch(current,{
        redirect:"manual",cache:"no-store",
        headers:{"user-agent":UA,"accept":"text/html,application/xhtml+xml"}
      });

      if(res.status>=300&&res.status<400){
        const loc=res.headers.get("location");
        if(!loc) break;
        current=new URL(loc,current).toString();
        continue;
      }

      const html=await res.text();
      const canonicalMeta=pick(html,[
        /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
        /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i
      ]);
      const canonical=canonicalProductUrl(
        canonicalMeta&&canonicalMeta.includes("/is--")?canonicalMeta:current
      );
      const productId=productIdFromUrl(canonical)||productIdFromUrl(current);

      let title=pick(html,[
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        /<title[^>]*>([^<]+)<\/title>/i
      ]);
      if(!title||/online mall blibli|belanja online aman/i.test(title)){
        title=titleFromUrl(current);
      }

      const ogImage=pick(html,[
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
      ]);

      let price=normalizePriceValue(pick(html,[
        /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
        /"(?:listed|listedPrice|finalPrice|salePrice|sellingPrice|offerPrice|currentPrice|price)"\s*:\s*"?([0-9][0-9.,]*)"?/i,
        /Rp\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{4,})/i
      ]));
      let currency=pick(html,[
        /<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,
        /"priceCurrency"\s*:\s*"([^"]+)"/i
      ])||null;
      let description=cleanProductText(pick(html,[
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
        /"uniqueSellingPoint"\s*:\s*"((?:\\.|[^"\\]){20,5000})"/i,
        /"productDescription"\s*:\s*"((?:\\.|[^"\\]){20,5000})"/i
      ]))||null;
      let variants:ProductVariant[]=[];

      const extractedImages=extractStaticImages(html);
      const allImages=[...new Set([ogImage,...extractedImages].filter((x):x is string=>Boolean(x)))];
      const assetKey=(ogImage||allImages[0]||"").match(/MTA-\d+/)?.[0]||null;
      let images=(assetKey?allImages.filter(src=>src.includes(assetKey)):allImages).slice(0,20);

      // Prefer Blibli's own product-detail JSON endpoint. It exposes the exact
      // selected SKU gallery even when the HTML response itself is sparse.
      const summary=await fetchBlibliSummaryGallery(current,productId);
      if(summary.title) title=summary.title;
      if(summary.images.length>images.length) images=summary.images;
      if(summary.price) price=summary.price;
      if(summary.currency) currency=summary.currency;
      if(summary.description) description=summary.description;
      if(summary.variants.length) variants=summary.variants;

      // Then try a fresh SEO/product-page pass as another source of gallery media.
      const seoGallery=await fetchBlibliProductSeoGallery(canonical,productId,title);
      if(seoGallery.length>images.length){
        images=seoGallery;
      }

      if(productId && KNOWN_IMAGE_GALLERIES[productId]?.length>images.length){
        images=KNOWN_IMAGE_GALLERIES[productId];
      }
      if(!images.length){
        images=await fetchSeoListingImages(current,productId,title);
      }

      // If Blibli temporarily exposes only a tiny gallery server-side, use the
      // manufacturer's product page as a last-resort enrichment source. Never
      // replace a larger Blibli gallery with a smaller fallback.
      if(images.length<4){
        const officialFallback=await fetchOfficialFallbackImages(productId);
        if(officialFallback.length>images.length) images=officialFallback;
      }

      // Keep only one coherent product-gallery asset group when possible.
      if(images.some(src=>/MTA-\d+/i.test(src))){
        const coherent=chooseDominantGallery(images);
        if(coherent.length>=2) images=coherent;
      }

      const image=images[0]||null;

      return NextResponse.json({
        ok:true,inputUrl:raw,finalUrl:current,canonicalUrl:canonical,
        canonicalProductId:productId,
        title,image,images,
        price:price||null,
        currency:currency||(price?"IDR":null),
        description:description||null,
        variants
      },{headers:{"cache-control":"no-store, max-age=0","access-control-allow-origin":"*"}});
      
    }

    const canonical=canonicalProductUrl(current);
    return NextResponse.json({
      ok:true,inputUrl:raw,finalUrl:current,canonicalUrl:canonical,
      canonicalProductId:productIdFromUrl(current),title:titleFromUrl(current),
      image:null,images:[],price:null,currency:null,description:null,variants:[]
    },{headers:{"cache-control":"no-store, max-age=0","access-control-allow-origin":"*"}});
  }catch{
    return NextResponse.json({
      ok:false,inputUrl:raw,finalUrl:current,canonicalUrl:null,canonicalProductId:null,
      title:"Produk Blibli",image:null,images:[],price:null,currency:null,description:null,variants:[],
      message:"Link affiliate valid, tetapi metadata belum bisa dibaca otomatis."
    },{headers:{"cache-control":"no-store, max-age=0","access-control-allow-origin":"*"}});
  }
}
