const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(){
  const tables={Draft:[['headers']],Published:[['headers']],Config:[['key','value'],['ADMIN_KEY','test-key']],Logs:[['time','action','id','status','message']]};
  let locked=false;
  const sheet=name=>({getLastRow:()=>tables[name].length,getDataRange:()=>({getValues:()=>tables[name].map(r=>[...r])}),getRange:(row,col,rows,cols)=>({getValues:()=>Array.from({length:rows},(_,i)=>Array.from({length:cols},(_,j)=>tables[name][row-1+i]?.[col-1+j]??'')),setValues:values=>values.forEach((r,i)=>{tables[name][row-1+i]=[...r]}),clearContent:()=>{tables[name].splice(row-1,rows)}}),appendRow:r=>tables[name].push(r),deleteRow:r=>tables[name].splice(r-1,1)});
  const ctx=vm.createContext({SpreadsheetApp:{openById:()=>({getSheetByName:sheet}),flush:()=>{}},LockService:{getScriptLock:()=>({tryLock:()=>{locked=true;return true},hasLock:()=>locked,releaseLock:()=>{locked=false}})},ContentService:{MimeType:{JSON:'json',JAVASCRIPT:'js'},createTextOutput:s=>({text:s,setMimeType(){return this}})}});
  vm.runInContext(fs.readFileSync('apps-script/Code.gs','utf8'),ctx);
  const post=p=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify({key:'test-key',...p})}}).text);
  const get=p=>JSON.parse(ctx.doGet({parameter:p}).text);
  return {ctx,tables,post,get,locked:()=>locked};
}
const product={id:'ACO-12345-00123-00001',name:'Cable',images:['https://example.com/cable.jpg'],affiliateUrl:'https://s.blibli.com/example',canonicalUrl:'https://www.blibli.com/p/cable/is--ACO-12345-00123-00001',features:[]};
test('public reads include an intentionally empty catalog and reject writes',()=>{
 const {get,tables}=setup();assert.deepEqual(get({action:'catalog'}).products,[]);assert.equal(get({action:'delete',id:product.id,key:'test-key'}).ok,false);assert.equal(tables.Draft.length,1);
});
test('admin authorization required before draft reads and mutations',()=>{
 const {post,tables}=setup();assert.equal(post({action:'savePublish',key:'wrong',product}).code,'UNAUTHORIZED');assert.equal(post({action:'draft',key:''}).ok,false);assert.equal(tables.Draft.length,1);
});
test('import, deduplicate by identity, publish, then delete last item',()=>{
 const {post,get,tables,locked}=setup();assert.equal(post({action:'savePublish',product}).ok,true);assert.equal(tables.Draft.length,2);assert.equal(get({action:'catalog'}).products.length,1);
 assert.equal(post({action:'savePublish',product:{...product,name:'Updated'}}).ok,true);assert.equal(tables.Draft.length,2);assert.equal(get({action:'catalog'}).products[0].name,'Updated');
 assert.equal(post({action:'delete',id:product.id}).ok,true);assert.deepEqual(get({action:'catalog'}).products,[]);assert.equal(locked(),false);
});
test('validate entire batch before writes and release lock on errors',()=>{
 const {post,tables,locked}=setup();assert.equal(post({action:'savePublish',products:[product,{...product,id:'BAD',affiliateUrl:'javascript:alert(1)'}]}).ok,false);assert.equal(tables.Draft.length,1);assert.equal(locked(),false);
});
test('reload writes only Draft; publish transfers it to client',()=>{
 const {ctx,post,get}=setup();post({action:'savePublish',product});ctx.reloadFromBlibli_=p=>({...p,name:'Draft revision'});
 assert.equal(post({action:'reloadDom',url:product.canonicalUrl}).ok,true);assert.equal(get({action:'catalog'}).products[0].name,'Cable');assert.equal(post({action:'draft'}).products[0].name,'Draft revision');
 post({action:'publish',id:product.id});assert.equal(get({action:'catalog'}).products[0].name,'Draft revision');
});
test('unsafe URLs and duplicate batch rejected without writes',()=>{
 const {post,tables}=setup();assert.equal(post({action:'resolve',url:'https://blibli.com.evil.test/a'}).ok,false);assert.equal(post({action:'savePublish',products:[product,product]}).ok,false);assert.equal(tables.Draft.length,1);
});
