import {NextRequest,NextResponse} from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;

const UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36";

function normalizeImageUrl(src:string){
  let value=src.trim()
    .replace(/\\u002F/gi,"/")
    .replace(/\\u003A/gi,":")
    .replace(/\\u0026/gi,"&")
    .replace(/\\\//g,"/")
    .replace(/&amp;/g,"&");
  if(value.startsWith("//")) value="https:"+value;
  value=value.replace(/^http:\/\//i,"https://");
  value=value.replace(/\/images\/catalog\/thumbnail\//i,"/images/catalog/full/");
  return value;
}

function isBlibliImage(src:string){
  return /^https:\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\/full\//i.test(src);
}

function pickGallery(images:string[],ogImage:string|null){
  const clean=[...new Set(images.map(normalizeImageUrl).filter(isBlibliImage))];
  if(!clean.length) return [] as string[];

  const groups=new Map<string,string[]>();
  for(const src of clean){
    const asset=src.match(/MTA-\d+/i)?.[0]||"__NO_ASSET__";
    const list=groups.get(asset)||[];
    if(!list.includes(src)) list.push(src);
    groups.set(asset,list);
  }

  const ogAsset=ogImage?.match(/MTA-\d+/i)?.[0]||null;
  const ranked=[...groups.entries()]
    .filter(([asset])=>asset!=="__NO_ASSET__")
    .sort((a,b)=>{
      const byCount=b[1].length-a[1].length;
      if(byCount!==0) return byCount;
      if(ogAsset&&a[0]===ogAsset) return -1;
      if(ogAsset&&b[0]===ogAsset) return 1;
      return 0;
    });

  // The largest coherent MTA group is the gallery. og:image is only a
  // tie-breaker; it must never force a 1-2 image group over an 8+ image group.
  if(ranked.length) return ranked[0][1].slice(0,40);
  return clean.slice(0,40);
}

function productIdFromUrl(value:string){
  try{
    const u=new URL(value);
    const match=u.pathname.match(/\/is--([^/?#]+)/i);
    return match?.[1]||null;
  }catch{return null}
}

export async function GET(req:NextRequest){
  const raw=req.nextUrl.searchParams.get("url");
  if(!raw) return NextResponse.json({ok:false,message:"url wajib diisi"},{status:400});

  let browser:Awaited<ReturnType<typeof puppeteer.launch>>|null=null;

  try{
    browser=await puppeteer.launch({
      args:chromium.args,
      defaultViewport:{width:1440,height:1000},
      executablePath:await chromium.executablePath(),
      headless:true
    });

    const page=await browser.newPage();
    await page.setUserAgent(UA);
    await page.setExtraHTTPHeaders({
      "accept-language":"id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
    });

    await page.goto(raw,{waitUntil:"domcontentloaded",timeout:45000});
    await page.waitForNetworkIdle({idleTime:900,timeout:10000}).catch(()=>{});

    // Trigger lazy-loaded gallery thumbnails and media.
    for(const ratio of [0,0.2,0.45,0.7,1]){
      await page.evaluate((value)=>{
        const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
        window.scrollTo(0,Math.round(max*value));
      },ratio);
      await new Promise(resolve=>setTimeout(resolve,450));
    }
    await page.evaluate(()=>window.scrollTo(0,0));
    await new Promise(resolve=>setTimeout(resolve,500));

    const dom=await page.evaluate(()=>{
      const urls:string[]=[];
      const add=(value:string|null|undefined)=>{
        if(!value) return;
        const decoded=value.replace(/&amp;/g,"&").trim();
        if(decoded&&!urls.includes(decoded)) urls.push(decoded);
      };
      const addSrcset=(value:string|null)=>{
        if(!value) return;
        for(const part of value.split(",")){
          add(part.trim().split(/\s+/)[0]||null);
        }
      };

      document.querySelectorAll("img").forEach(img=>{
        add(img.currentSrc);
        add(img.src);
        add(img.getAttribute("data-src"));
        add(img.getAttribute("data-original"));
        add(img.getAttribute("data-lazy-src"));
        addSrcset(img.getAttribute("srcset"));
        addSrcset(img.getAttribute("data-srcset"));
      });
      document.querySelectorAll("source").forEach(source=>{
        addSrcset(source.getAttribute("srcset"));
        addSrcset(source.getAttribute("data-srcset"));
      });

      document.querySelectorAll(
        '[style*="background"],[data-image],[data-image-url],[data-zoom-image],[data-full-image],video[poster]'
      ).forEach(node=>{
        const el=node as HTMLElement;
        const bg=getComputedStyle(el).backgroundImage;
        if(bg&&bg!=="none"){
          for(const match of bg.matchAll(/url\\(["']?([^"')]+)["']?\\)/g)) add(match[1]);
        }
        for(const attr of ["data-image","data-image-url","data-zoom-image","data-full-image","poster"]){
          add(el.getAttribute(attr));
        }
      });

      for(const entry of performance.getEntriesByType("resource")){
        const name=(entry as PerformanceResourceTiming).name;
        if(name) add(name);
      }

      // Embedded state/scripts often contain gallery URLs that are not mounted
      // as <img> until the user moves the product carousel.
      const html=document.documentElement.innerHTML
        .replace(/\\u002F/gi,"/")
        .replace(/\\u003A/gi,":")
        .replace(/\\u0026/gi,"&")
        .replace(/\\\//g,"/");
      const embedded=html.match(/(?:https?:)?\/\/(?:www\.)?static-src\.com\/wcsstore\/Indraprastha\/images\/catalog\/[^"'\\\s<>]+/gi)||[];
      embedded.forEach(add);

      const canonical=(document.querySelector('link[rel="canonical"]') as HTMLLinkElement|null)?.href
        ||(document.querySelector('meta[property="og:url"]') as HTMLMetaElement|null)?.content
        ||location.href;
      const ogImage=(document.querySelector('meta[property="og:image"]') as HTMLMetaElement|null)?.content||null;
      const title=(document.querySelector("h1")?.textContent
        ||(document.querySelector('meta[property="og:title"]') as HTMLMetaElement|null)?.content
        ||document.title
        ||"Produk Blibli").trim();
      const price=(document.querySelector('meta[property="product:price:amount"]') as HTMLMetaElement|null)?.content||null;
      const currency=(document.querySelector('meta[property="product:price:currency"]') as HTMLMetaElement|null)?.content||null;

      return {urls,canonical,ogImage,title,price,currency,finalUrl:location.href};
    });

    const images=pickGallery(dom.urls,dom.ogImage);
    const canonical=dom.canonical.split("?")[0].replace(/\/$/,"");
    const productId=productIdFromUrl(canonical)||productIdFromUrl(dom.finalUrl);

    return NextResponse.json({
      ok:true,
      source:"rendered-dom",
      inputUrl:raw,
      finalUrl:dom.finalUrl,
      canonicalUrl:canonical,
      canonicalProductId:productId,
      title:dom.title,
      image:images[0]||null,
      images,
      price:dom.price,
      currency:dom.currency
    },{headers:{"cache-control":"no-store, max-age=0"}});
  }catch(error){
    return NextResponse.json({
      ok:false,
      source:"rendered-dom",
      inputUrl:raw,
      message:error instanceof Error?error.message:"Reload DOM gagal"
    },{status:500,headers:{"cache-control":"no-store, max-age=0"}});
  }finally{
    if(browser) await browser.close().catch(()=>{});
  }
}
