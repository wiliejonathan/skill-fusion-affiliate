export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEaWGv8ykfHPDqI4eUAp0U9FqYWeMb3RsS57K9QDsxnvbOI9h0HArIVASgn2llUZqaNQ/exec";

// Simple POST avoids a preflight and keeps the admin key out of URLs/JSONP.
function requestAppsScriptJsonp(action:string,payload:Record<string,unknown>={}){
  return new Promise<any>((resolve,reject)=>{
    if(typeof window==="undefined"||typeof document==="undefined"){
      reject(new Error("JSONP hanya tersedia di browser"));
      return;
    }

    const callback="__skillFusion_"+Date.now()+"_"+Math.random().toString(36).slice(2);
    const script=document.createElement("script");
    const url=new URL(APPS_SCRIPT_URL);

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
        reject(new Error(data?.message||"Koneksi Apps Script gagal"));
        return;
      }
      resolve(data);
    };

    script.onerror=()=>{
      cleanup();
      reject(new Error("Apps Script tidak dapat dijangkau"));
    };

    const timer=window.setTimeout(()=>{
      cleanup();
      reject(new Error("Apps Script timeout"));
    },action==="price"?15000:30000);

    script.src=url.toString();
    script.async=true;
    document.head.appendChild(script);
  });
}

export async function requestAppsScript(action:string, payload:Record<string,unknown>={}, key?:string){
  const isPublicGet=action==="catalog"||action==="health"||action==="price";

  // Google Apps Script ContentService redirects GET responses to
  // script.googleusercontent.com. Some mobile browsers reject that redirect
  // during cross-origin fetch, so public reads use JSONP instead. Code.gs
  // already supports callback= and returns application/javascript.
  if(isPublicGet&&typeof window!=="undefined"){
    return requestAppsScriptJsonp(action,payload);
  }

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),action==="price"?15000:90000);
  try{
    const url=new URL(APPS_SCRIPT_URL);
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

    const response=await globalThis.fetch(url.toString(),options);
    const text=await response.text();
    let data;
    try{data=JSON.parse(text)}catch{
      throw new Error("Apps Script belum aktif. Deploy versi terbaru Code.gs sebagai Web app.");
    }

    if(!response.ok||!data?.ok){
      if(data?.code==="UNAUTHORIZED"&&typeof window!=="undefined"){
        window.sessionStorage.removeItem("skillfusion:admin-key");
      }
      throw new Error(data?.message||"Koneksi Apps Script gagal");
    }

    return data;
  }finally{
    clearTimeout(timeout);
  }
}
