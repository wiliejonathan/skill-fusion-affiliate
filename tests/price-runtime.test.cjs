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


test('direct Blibli DOM parser extracts visible commerce and product detail fields',()=>{
 const ctx=runtime();
 const html=[
  '<div class="price-component__container">',
  '<span class="sold-seen-label__label">Terjual 2,5 rb</span>',
  '<span class="product-price__after" data-testid="priceComponentOffered">Rp21.000</span>',
  '<span class="product-price__before">Rp79.000</span>',
  '<div class="blu-badge b-secondary b-red"><span>73%</span></div>',
  '</div>',
  '<div data-testid="variantSection" class="pdp__variant middle-case">',
  '<span><span class="label">Warna:&nbsp;</span><span>Red</span></span>',
  '<div class="product-chip d-selected product-variant__item" data-testid="colorVariantImage-0"><img src="https://www.static-src.com/wcsstore/Indraprastha/images/catalog/thumbnail/catalog-image/MTA-6370783/item.jpg?w=46" alt="Red"><div class="product-chip__desc">Red</div></div>',
  '<div class="product-chip d-oos product-variant__item" data-testid="colorVariantImage-1"><img src="https://www.static-src.com/wcsstore/Indraprastha/images/catalog/thumbnail/catalog-image/MTA-6370783/item.jpg?w=46" alt="TOSCA"><div class="product-chip__desc">TOSCA</div></div>',
  '<div class="attribute"><span class="label">Kode Produk: </span><abbr class="blu-chip__label">-</abbr></div>',
  '</div>',
  '<div class="product-description-section"><div class="product-description-section__title"><span>Deskripsi</span></div><div class="features"><div>• 2A Fast Charging<br>• Garansi 18 Bulan</div></div><div><p>ACMIC CFC100 Kabel Data Charger USB Type C<br>Panjang : 100cm</p></div></div>',
  '<div class="product-specification"><table><tbody>',
  '<tr><td><span class="label">Kategori</span></td><td><span class="value link">Kabel Data</span></td></tr>',
  '<tr><td><span class="label">Merk</span></td><td><span class="value link">ACMIC</span></td></tr>',
  '<tr><td><span class="label">More specs</span></td><td><div class="more-specs__label"><span>Jenis Produk, Panjang Kabel, Tipe Garansi</span></div></td></tr>',
  '</tbody></table><span class="usp__item usp-ready">Jaminan stok tersedia</span></div>'
 ].join('');
 const data=ctx.extractBlibliDomData_(html);
 assert.equal(data.price,'21000');
 assert.equal(data.originalPrice,'79000');
 assert.equal(data.discountPercent,'73%');
 assert.equal(data.soldText,'Terjual 2,5 rb');
 assert.match(data.description,/ACMIC CFC100/);
 assert.equal(data.variants[0].name,'Warna');
 assert.equal(data.variants[0].selected,'Red');
 assert.equal(data.variants[0].values[0].selected,true);
 assert.equal(data.variants[0].values[1].outOfStock,true);
 assert.equal(data.category,'Kabel Data');
 assert.equal(data.brand,'ACMIC');
 assert.ok(data.specifications.some(x=>x.label==='Stok'&&x.value==='Jaminan stok tersedia'));
});
