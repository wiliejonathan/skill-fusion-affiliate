import {NextRequest,NextResponse} from "next/server";

const UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/143 Safari/537.36";

function pick(html:string,patterns:RegExp[]){
  for(const p of patterns){
    const m=html.match(p);
    if(m?.[1]) return m[1].replace(/&amp;/g,"&").trim();
  }
  return null;
}

function extractStaticImages(html:string){
  const results:string[]=[];
  const needle="https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/";
  let cursor=0;
  while(results.length<20){
    const start=html.indexOf(needle,cursor);
    if(start<0) break;
    const tail=html.slice(start);
    const match=tail.match(/^[^"'\s<>]+/);
    const raw=match?.[0]?.replace(/&amp;/g,"&")||"";
    if(raw && !results.includes(raw)) results.push(raw);
    cursor=start+needle.length;
  }
  return results;
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
      const images=(assetKey?allImages.filter(src=>src.includes(assetKey)):allImages).slice(0,12);
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
        canonicalProductId:productIdFromUrl(canonical)||productIdFromUrl(current),
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
