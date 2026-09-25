import {NextResponse} from "next/server";

export const dynamic="force-dynamic";

export async function GET(){
  try{
    const res=await fetch("https://skill-fusion-admin.vercel.app/api/catalog",{
      cache:"no-store",
      headers:{"accept":"application/json"}
    });
    const text=await res.text();
    return new NextResponse(text,{
      status:res.status,
      headers:{
        "content-type":"application/json; charset=utf-8",
        "cache-control":"no-store, max-age=0"
      }
    });
  }catch(error){
    return NextResponse.json({ok:false,products:[],message:String(error)},{status:503});
  }
}
