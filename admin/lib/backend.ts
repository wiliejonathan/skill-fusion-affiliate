import {requestAppsScript} from "../../shared/apps-script";

let adminKey:string|undefined;
function getKey(){
  adminKey=adminKey||window.sessionStorage.getItem("skillfusion:admin-key")||window.localStorage.getItem("skillfusion:adminKey")||undefined;
  if(!adminKey){
    adminKey=window.prompt("Masukkan ADMIN_KEY dari tab Config Google Sheets untuk mengakses Admin.")?.trim()||undefined;
    if(!adminKey) throw new Error("Admin belum terhubung. Muat ulang halaman dan masukkan ADMIN_KEY.");
    window.sessionStorage.setItem("skillfusion:admin-key",adminKey);
  }
  return adminKey;
}

// Retains the existing UI's request contract while moving every operation to GAS.
export async function backendFetch(input:string,init:RequestInit={}){
  const url=new URL(input,"https://skill-fusion.invalid");
  const method=init.method||"GET";
  let action="draft",payload:Record<string,unknown>={};
  if(url.pathname==="/api/catalog"){
    if(method==="POST") {action="savePublish";payload=JSON.parse(String(init.body||"{}"))}
    else if(method==="DELETE") {action="delete";payload={id:url.searchParams.get("id")}}
  }else if(url.pathname==="/api/resolve"||url.pathname==="/api/reload-dom"){
    action=url.pathname==="/api/resolve"?"resolve":"reloadDom";
    payload={url:url.searchParams.get("url")};
  }else throw new Error("API tidak dikenal");
  try{
    const data=await requestAppsScript(action,payload,getKey());
    return {ok:true,json:async()=>data};
  }catch(error){
    if(!window.sessionStorage.getItem("skillfusion:admin-key")) adminKey=undefined;
    throw error;
  }
}
