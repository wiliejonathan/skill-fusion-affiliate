export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEaWGv8ykfHPDqI4eUAp0U9FqYWeMb3RsS57K9QDsxnvbOI9h0HArIVASgn2llUZqaNQ/exec";

// Simple POST avoids a preflight and keeps the admin key out of URLs/JSONP.
export async function requestAppsScript(action:string, payload:Record<string,unknown>={}, key?:string){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),90000);
  try{
    const url=new URL(APPS_SCRIPT_URL);
    let options:RequestInit={signal:controller.signal,redirect:"follow",credentials:"omit"};
    if(action==="catalog"||action==="health"||action==="price"){
      url.searchParams.set("action",action);
      Object.entries(payload).forEach(([name,value])=>{
        if(value!==undefined&&value!==null) url.searchParams.set(name,String(value));
      });
      url.searchParams.set("ts",String(Date.now()));
    }else{
      options={...options,method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({...payload,action,key})};
    }
    const response=await globalThis.fetch(url.toString(),options);
    const text=await response.text();
    let data;
    try{data=JSON.parse(text)}catch{throw new Error("Apps Script belum aktif. Deploy versi terbaru Code.gs sebagai Web app.")}
    if(!response.ok||!data?.ok){
      if(data?.code==="UNAUTHORIZED"&&typeof window!=="undefined") window.sessionStorage.removeItem("skillfusion:admin-key");
      throw new Error(data?.message||"Koneksi Apps Script gagal");
    }
    return data;
  }finally{clearTimeout(timeout)}
}
