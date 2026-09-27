export const DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEaWGv8ykfHPDqI4eUAp0U9FqYWeMb3RsS57K9QDsxnvbOI9h0HArIVASgn2llUZqaNQ/exec";
export const APPS_SCRIPT_URL_STORAGE_KEY = "skillfusion:apps-script-url";

function normalizeAppsScriptUrl(value:string){
  const url=String(value||"").trim();
  if(!url) return "";
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:[?#].*)?$/i.test(url)){
    throw new Error("URL Apps Script harus berupa URL Web App /exec yang aktif.");
  }
  const parsed=new URL(url);
  parsed.search="";
  parsed.hash="";
  return parsed.toString();
}

export function getAppsScriptUrl(){
  if(typeof window!=="undefined"){
    const stored=window.localStorage.getItem(APPS_SCRIPT_URL_STORAGE_KEY);
    if(stored){
      try{return normalizeAppsScriptUrl(stored)}catch{}
    }

    const runtime=(window as any).SKILL_FUSION_CONFIG?.APPS_SCRIPT_URL;
    if(runtime){
      try{return normalizeAppsScriptUrl(String(runtime))}catch{}
    }
  }
  return DEFAULT_APPS_SCRIPT_URL;
}

export function setAppsScriptUrl(value:string){
  const url=normalizeAppsScriptUrl(value);
  if(typeof window!=="undefined") window.localStorage.setItem(APPS_SCRIPT_URL_STORAGE_KEY,url);
  return url;
}

export function resetAppsScriptUrl(){
  if(typeof window!=="undefined") window.localStorage.removeItem(APPS_SCRIPT_URL_STORAGE_KEY);
}

function connectionError(message:string,code:string){
  const error=new Error(message) as Error&{code?:string};
  error.code=code;
  return error;
}

// Public reads use JSONP because Google Apps Script ContentService redirects
// through script.googleusercontent.com and mobile browsers can reject CORS.
function requestAppsScriptJsonp(action:string,payload:Record<string,unknown>={}){
  return new Promise<any>((resolve,reject)=>{
    if(typeof window==="undefined"||typeof document==="undefined"){
      reject(connectionError("JSONP hanya tersedia di browser","BROWSER_REQUIRED"));
      return;
    }

    const callback="__skillFusion_"+Date.now()+"_"+Math.random().toString(36).slice(2);
    const script=document.createElement("script");
    const endpoint=getAppsScriptUrl();
    const url=new URL(endpoint);

    url.searchParams.set("action",action);
    Object.entries(payload).forEach(([name,value])=>{
      if(value!==undefined&&value!==null) url.searchParams.set(name,String(value));
    });
    url.searchParams.set("callback",callback);
    url.searchParams.set("ts",String(Date.now()));

    const cleanup=()=>{
      window.clearTimeout(timer);
      script.remove();
      try{delete (window as any)[callback]}catch{(window as any)[callback]=undefined}
    };

    (window as any)[callback]=(data:any)=>{
      cleanup();
      if(!data?.ok){
        reject(connectionError(data?.message||"Koneksi Apps Script gagal",data?.code||"APPS_SCRIPT_ERROR"));
        return;
      }
      resolve(data);
    };

    script.onerror=()=>{
      cleanup();
      reject(connectionError(
        "Apps Script tidak dapat dijangkau. Periksa URL Web App /exec yang aktif.",
        "APPS_SCRIPT_UNREACHABLE"
      ));
    };

    const timer=window.setTimeout(()=>{
      cleanup();
      reject(connectionError("Apps Script timeout. Periksa deployment Web App.","APPS_SCRIPT_TIMEOUT"));
    },action==="price"?15000:30000);

    script.src=url.toString();
    script.async=true;
    document.head.appendChild(script);
  });
}

function appsScriptHtmlError(text:string,status:number,url:string){
  const value=String(text||"");
  if(/accounts\.google\.com|ServiceLogin|Sign in with Google|Masuk.*Google/i.test(value)){
    return connectionError(
      "Web App Apps Script meminta login Google. Set deployment 'Who has access' ke 'Anyone'.",
      "APPS_SCRIPT_PRIVATE"
    );
  }
  if(status===404||/Page Not Found|file you have requested does not exist/i.test(value)){
    return connectionError(
      "URL Web App Apps Script tidak aktif atau deployment sudah diganti. Masukkan URL /exec dari deployment aktif.",
      "APPS_SCRIPT_URL_INACTIVE"
    );
  }
  if(/Authorization is required|You need permission|access denied/i.test(value)){
    return connectionError(
      "Akses Web App Apps Script belum publik. Ubah akses deployment menjadi 'Anyone'.",
      "APPS_SCRIPT_PRIVATE"
    );
  }
  return connectionError(
    "Apps Script merespons halaman non-JSON. Periksa URL dan akses deployment Web App.",
    "APPS_SCRIPT_NON_JSON"
  );
}

export async function requestAppsScript(action:string, payload:Record<string,unknown>={}, key?:string){
  const isPublicGet=action==="catalog"||action==="health"||action==="price";

  if(isPublicGet&&typeof window!=="undefined"){
    return requestAppsScriptJsonp(action,payload);
  }

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),action==="price"?15000:90000);
  try{
    const endpoint=getAppsScriptUrl();
    const url=new URL(endpoint);
    let options:RequestInit={signal:controller.signal,redirect:"follow",credentials:"omit"};

    if(isPublicGet){
      url.searchParams.set("action",action);
      Object.entries(payload).forEach(([name,value])=>{
        if(value!==undefined&&value!==null) url.searchParams.set(name,String(value));
      });
      url.searchParams.set("ts",String(Date.now()));
    }else{
      options={
        ...options,
        method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify({...payload,action,key})
      };
    }

    let response:Response;
    try{
      response=await globalThis.fetch(url.toString(),options);
    }catch(error){
      if(error instanceof DOMException&&error.name==="AbortError"){
        throw connectionError("Apps Script timeout. Periksa deployment Web App.","APPS_SCRIPT_TIMEOUT");
      }
      throw connectionError("Apps Script tidak dapat dijangkau. Periksa URL Web App /exec yang aktif.","APPS_SCRIPT_UNREACHABLE");
    }

    const text=await response.text();
    let data;
    try{
      data=JSON.parse(text);
    }catch{
      throw appsScriptHtmlError(text,response.status,response.url||url.toString());
    }

    if(!response.ok||!data?.ok){
      if(data?.code==="UNAUTHORIZED"&&typeof window!=="undefined"){
        window.sessionStorage.removeItem("skillfusion:admin-key");
      }
      throw connectionError(data?.message||"Koneksi Apps Script gagal",data?.code||"APPS_SCRIPT_ERROR");
    }

    return data;
  }finally{
    clearTimeout(timeout);
  }
}
