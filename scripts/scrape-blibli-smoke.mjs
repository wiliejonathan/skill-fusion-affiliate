import {chromium} from "playwright";
import fs from "node:fs";
const catalogUrl=process.env.CATALOG_URL;
const out=process.env.OUTPUT_PATH||"site/data/blibli-live.json";
const r=await fetch(catalogUrl);
if(!r.ok) throw new Error("catalog HTTP "+r.status);
const j=await r.json();
const p=j.products?.find(x=>/^https:\/\/(?:www\.)?blibli\.com\//i.test(String(x.canonicalUrl||"")));
if(!p) throw new Error("no product");
const ml=new URL("https://api.microlink.io/");
ml.searchParams.set("url",p.canonicalUrl);
ml.searchParams.set("prerender","true");
ml.searchParams.set("waitForSelector",'[data-testid="priceComponentOffered"]');
ml.searchParams.set("meta","false");
ml.searchParams.set("data.price.selector",'[data-testid="priceComponentOffered"]');
ml.searchParams.set("data.price.attr","text");
ml.searchParams.set("data.originalPrice.selector",".product-price__before");
ml.searchParams.set("data.originalPrice.attr","text");
ml.searchParams.set("data.sold.selector",".sold-seen-label__label");
ml.searchParams.set("data.sold.attr","text");
ml.searchParams.set("data.description.selector",".product-description-section");
ml.searchParams.set("data.description.attr","text");
try{
 const mr=await fetch(ml,{headers:{accept:"application/json"}});
 const mt=await mr.text();
 console.log("MICROLINK_HTTP",mr.status,mt.slice(0,4000));
 try{
  const mj=JSON.parse(mt);
  const mp=String(mj?.data?.price||"").replace(/[^0-9]/g,"");
  if(mr.ok&&mp){
   const result={
    generatedAt:new Date().toISOString(),
    products:[{
     id:p.id,canonicalUrl:p.canonicalUrl,title:p.name||"",
     price:mp,currency:"IDR",
     originalPrice:String(mj?.data?.originalPrice||"").replace(/[^0-9]/g,""),
     soldText:String(mj?.data?.sold||""),
     description:String(mj?.data?.description||""),
     httpStatus:mr.status,source:"microlink-prerender",diagnostic:"ok"
    }]
   };
   fs.mkdirSync(out.split("/").slice(0,-1).join("/"),{recursive:true});
   fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n");
   console.log(JSON.stringify(result,null,2));
   process.exit(0);
  }
 }catch{}
}catch(e){console.log("MICROLINK_ERROR",String(e?.message||e));}

const browser=await chromium.launch({headless:true,args:["--disable-blink-features=AutomationControlled","--no-sandbox"]});
const context=await browser.newContext({
 locale:"id-ID",timezoneId:"Asia/Jakarta",
 userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
});
await context.addInitScript(()=>{try{Object.defineProperty(navigator,"webdriver",{get:()=>undefined})}catch{}});
const page=await context.newPage();
let summary=null;
page.on("response",async res=>{
 try{
  if(/_summary(?:\?|$)/i.test(res.url())&&/json/i.test(res.headers()["content-type"]||"")) summary=await res.json();
 }catch{}
});
const resp=await page.goto(p.canonicalUrl,{waitUntil:"domcontentloaded",timeout:60000});
try{await page.waitForLoadState("networkidle",{timeout:12000})}catch{}
try{await page.waitForSelector('[data-testid="priceComponentOffered"],.product-price__after',{timeout:12000})}catch{}
const dom=await page.evaluate(()=>({
 title:document.querySelector("h1")?.textContent?.trim()||document.title,
 price:document.querySelector('[data-testid="priceComponentOffered"]')?.textContent||document.querySelector(".product-price__after")?.textContent||"",
 body:(document.body?.innerText||"").slice(0,2000)
}));
const norm=v=>String(v||"").replace(/[^0-9]/g,"");
let price=norm(dom.price);
if(!price&&summary){
 const seen=new Set();
 const walk=o=>{
  if(!o||typeof o!=="object"||seen.has(o))return "";
  seen.add(o);
  if(Array.isArray(o)){for(const x of o){const z=walk(x);if(z)return z}return ""}
  for(const k of ["listed","listedPrice","finalPrice","salePrice","sellingPrice","offerPrice","currentPrice","price"]){
   if(o[k]!=null){const z=norm(o[k]);if(z)return z}
  }
  for(const x of Object.values(o)){const z=walk(x);if(z)return z}
  return "";
 };
 price=walk(summary.data||summary);
}
const result={
 generatedAt:new Date().toISOString(),
 products:[{
  id:p.id,
  canonicalUrl:p.canonicalUrl,
  title:dom.title,
  price,
  currency:price?"IDR":"",
  httpStatus:resp?.status()??null,
  source:summary?"playwright+summary":"playwright-dom",
  diagnostic:price?"ok":dom.body.replace(/\s+/g," ").slice(0,500)
 }]
};
fs.mkdirSync(out.split("/").slice(0,-1).join("/"),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result,null,2));
await browser.close();
if(!price)process.exit(2);
