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
  "ACO-60021-00122-00005":"https://acmic.id/products/acmic-cfc100-kabel-data-charger-usb-type-c-100cm-fast-charging-cable"
};

const KNOWN_IMAGE_GALLERIES:Record<string,string[]>={
  "XIO-60022-01141-00001":[
    "https://4phones.eu/cdn/shop/files/90000810874_A.jpg?v=1770447730",
    "https://xlineparts.com/storage/images/products/1738406224_7799.jpg"
  ],
  "ACO-60021-00234-00001":[
    "https://acmic.id/cdn/shop/files/CABLE_PDC100_1000x.jpg?v=1720595179"
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
    .replace(/\\u0026/gi,"&")
    .replace(/\\\//g,"/")
    .replace(/&amp;/g,"&")
    .replace(/&quot;/g,'"');
}

function extractStaticImages(html:string){
  const normalized=normalizeHtmlForImages(html);
  const matches=normalized.match(/https:\/\/www\.static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\/[^"'\\\s<>]+/gi)||[];
  return [...new Set(matches)].slice(0,40);
}

function extractOfficialShopImages(html:string){
  const normalized=normalizeHtmlForImages(html);
  const matches=[
    ...(normalized.match(/https:\/\/acmic\.id\/cdn\/shop\/files\/[^"'\\\s<>]+/gi)||[]),
    ...(normalized.match(/https:\/\/cdn\.shopify\.com\/s\/files\/[^"'\\\s<>]+/gi)||[])
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

async function fetchBlibliSummaryGallery(sourceUrl:string,productId:string|null):Promise<{title:string|null;images:string[]}>{
  if(!productId) return {title:null as string|null,images:[] as string[]};

  try{
    const source=new URL(sourceUrl);
    const pickupPointCode=source.searchParams.get("pickupPointCode");
    const endpoint=new URL(
      "https://www.blibli.com/backend/product-detail/products/is--"+
      encodeURIComponent(productId)+"/_summary"
    );
    if(pickupPointCode) endpoint.searchParams.set("pickupPointCode",pickupPointCode);

    const res=await fetch(endpoint.toString(),{
      cache:"no-store",
      redirect:"follow",
      headers:{
        "user-agent":UA,
        "accept":"application/json,text/plain,*/*",
        "accept-language":"id-ID,id;q=0.9,en;q=0.8",
        "referer":canonicalProductUrl(sourceUrl),
        "pragma":"no-cache",
        "cache-control":"no-cache"
      }
    });
    if(!res.ok) return {title:null,images:[]};

    const payload=await res.json();
    const data=payload?.data||payload;
    const images:string[]=(Array.isArray(data?.images)?data.images:[])
      .map((item:any)=>item?.full||item?.large||item?.medium||item?.thumbnail||null)
      .filter((x:unknown):x is string=>typeof x==="string"&&/^https?:\/\//i.test(x));

    return {
      title:typeof data?.name==="string"?data.name.trim():null,
      images:[...new Set(images)].slice(0,20)
    };
  }catch{
    return {title:null,images:[]};
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
      const extractedImages=extractStaticImages(html);
      const allImages=[...new Set([ogImage,...extractedImages].filter((x):x is string=>Boolean(x)))];
      const assetKey=(ogImage||allImages[0]||"").match(/MTA-\d+/)?.[0]||null;
      let images=(assetKey?allImages.filter(src=>src.includes(assetKey)):allImages).slice(0,20);

      // Prefer Blibli's own product-detail JSON endpoint. It exposes the exact
      // selected SKU gallery even when the HTML response itself is sparse.
      const summary=await fetchBlibliSummaryGallery(current,productId);
      if(summary.title) title=summary.title;
      if(summary.images.length>images.length){
        images=summary.images;
      }

      // Then try a fresh SEO/product-page pass as another source of gallery media.
      const seoGallery=await fetchBlibliProductSeoGallery(canonical,productId,title);
      if(seoGallery.length>images.length){
        images=seoGallery;
      }

      if(!images.length && productId && KNOWN_IMAGE_GALLERIES[productId]){
        images=KNOWN_IMAGE_GALLERIES[productId];
      }
      if(!images.length){
        images=await fetchSeoListingImages(current,productId,title);
      }
      if(!images.length){
        images=await fetchOfficialFallbackImages(productId);
      }

      // Keep only one coherent product-gallery asset group when possible.
      if(images.some(src=>/MTA-\d+/i.test(src))){
        const coherent=chooseDominantGallery(images);
        if(coherent.length>=2) images=coherent;
      }

      const image=images[0]||null;
      const price=pick(html,[
        /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
        /"price"\s*:\s*"?(\d+(?:\.\d+)?)"?/i
      ]);
      const currency=pick(html,[
        /<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,
        /"priceCurrency"\s*:\s*"([^"]+)"/i
      ]);

      return NextResponse.json({
        ok:true,inputUrl:raw,finalUrl:current,canonicalUrl:canonical,
        canonicalProductId:productId,
        title,image,images,price,currency
      });
    }

    const canonical=canonicalProductUrl(current);
    return NextResponse.json({
      ok:true,inputUrl:raw,finalUrl:current,canonicalUrl:canonical,
      canonicalProductId:productIdFromUrl(current),title:titleFromUrl(current),
      image:null,images:[],price:null,currency:null
    });
  }catch{
    return NextResponse.json({
      ok:false,inputUrl:raw,finalUrl:current,canonicalUrl:null,canonicalProductId:null,
      title:"Produk Blibli",image:null,images:[],price:null,currency:null,
      message:"Link affiliate valid, tetapi metadata belum bisa dibaca otomatis."
    });
  }
}
