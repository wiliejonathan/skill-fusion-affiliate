import {requestAppsScript} from "../../shared/apps-script";

const SESSION_KEY="skillfusion:admin-key";
const REMEMBER_KEY="skillfusion:adminKey";
let adminKey:string|undefined;

export function getStoredAdminKey(){
  if(typeof window==="undefined") return undefined;
  return window.sessionStorage.getItem(SESSION_KEY)||window.localStorage.getItem(REMEMBER_KEY)||undefined;
}

export function setAdminKey(key:string,remember:boolean){
  const value=key.trim();
  if(!value) throw new Error("Password Admin wajib diisi.");
  adminKey=value;
  window.sessionStorage.setItem(SESSION_KEY,value);
  if(remember) window.localStorage.setItem(REMEMBER_KEY,value);
  else window.localStorage.removeItem(REMEMBER_KEY);
}

export function clearAdminKey(){
  adminKey=undefined;
  if(typeof window!=="undefined"){
    window.sessionStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(REMEMBER_KEY);
  }
}

function getKey(){
  adminKey=adminKey||getStoredAdminKey();
  if(!adminKey) throw new Error("ADMIN_AUTH_REQUIRED");
  return adminKey;
}

export async function verifyAdminKey(key:string,remember:boolean){
  setAdminKey(key,remember);
  try{
    const data=await requestAppsScript("draft",{},getKey());
    return data;
  }catch(error){
    clearAdminKey();
    throw error;
  }
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
    if(!window.sessionStorage.getItem(SESSION_KEY)){
      clearAdminKey();
    }
    throw error;
  }
}
