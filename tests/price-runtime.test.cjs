const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('apps-script/Code.gs','utf8');
const product={id:'ACO-60021-00122-00005',name:'Cable',canonicalUrl:'https://www.blibli.com/p/cable/is--ACO-60021-00122-00005',pickupPointCode:'PP-3538803'};
function runtime(extra={}){const ctx=vm.createContext(extra);vm.runInContext(source,ctx);return ctx;}
test('SEO and selected variant lookups reach fetch in Apps Script without URL globals',()=>{
 const ctx=runtime();const calls=[];
 ctx.fetchSeoText_=(url,id)=>{calls.push({url,id});return '<meta property="product:price:amount" content="15900">';};
 assert.equal(ctx.seoProductPageData_(product).price,'15900');
 assert.equal(ctx.selectedVariantPagePrice_(product).price,'15900');
 assert.equal(calls[0].url,'https://www.blibli.com/p/cable/ps--ACO-60021-00122?pickupPointCode=PP-3538803');
 assert.equal(calls[1].url,'https://www.blibli.com/p/cable/ps--ACO-60021-00122?defaultItemSku=ACO-60021-00122-00005&cnc=false&pickupPointCode=PP-3538803');
 assert.ok(calls.every(c=>c.id===product.id));
});
test('AMP passes the product ID and parses price instead of raising ReferenceError',()=>{
 const ctx=runtime({URL});let received;
 ctx.fetchSeoText_=(url,id)=>{received={url,id};return '<meta property="product:price:amount" content="15900">';};
 assert.equal(ctx.ampProductPageData_(product).price,'15900');
 assert.equal(received.id,product.id);
 assert.equal(received.url,'https://www.blibli.com/amp/p/cable/is--ACO-60021-00122-00005?pickupPointCode=PP-3538803');
});
test('summary keeps pickup-point query context without browser globals',()=>{
 const ctx=runtime();const calls=[];
 ctx.fetchJson_=(url)=>{calls.push(url);return {data:{price:{listed:15900}}};};
 assert.equal(ctx.summaryData_(product.canonicalUrl,product.id,product.canonicalUrl+'?pickupPointCode=PP-3538803').price,'15900');
 assert.ok(calls.every(url=>url.includes('pickupPointCode=PP-3538803')));
});
test('refresh returns a fetched price through the complete Apps Script path',()=>{
 const ctx=runtime();
 ctx.fetchJsonFast_=()=>null;
 ctx.fetchSeoText_=()=>'<meta property="product:price:amount" content="15900">';
 const result=ctx.refreshPriceForProduct_(product);
 assert.equal(result.price,'15900');
 assert.equal(result.currency,'IDR');
 assert.equal(result.lastPriceSource,'seo-page');
 assert.ok(result.priceUpdatedAt);
});
