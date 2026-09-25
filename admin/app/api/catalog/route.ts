import {NextRequest,NextResponse} from "next/server";
import {neon} from "@neondatabase/serverless";

const DATABASE_URL=process.env.DATABASE_URL||"";
const SEED=[{"sequence":1,"id":"ACO-60021-00244-00014","canonicalProductId":"ACO-60021-00244-00014","name":"ACMIC Braided Line Kabel Data Charger 100cm Fast Charging Cable GC100 / GL100 / GM100","brand":"ACMIC","category":"Charging & Cable","images":["https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full45_njeqi5ul.jpg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full15_ph0p14k5.jpg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full16_mwsi08wd.jpg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full17_fecq856n.jpg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full18_gr5fkrpk.jpg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full44_k26116c9.jpg"],"affiliateUrl":"https://s.blibli.com/GNtk/0qrtsw3f","canonicalUrl":"https://www.blibli.com/p/acmic-braided-line-kabel-data-charger-100cm-fast-charging-cable-gc100-gl100-gm100/is--ACO-60021-00244-00014","badge":"Blibli Affiliate","features":["100 cm","Braided cable","Fast charging"]},{"sequence":2,"id":"ACO-60021-00070-00001","canonicalProductId":"ACO-60021-00070-00001","name":"ACMIC FC100 CFC100 Kabel Data Charger USB Type C 100CM Fast Charging Cable Hitam","brand":"ACMIC","category":"Charging & Cable","images":["https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full14_ge6ro4m0.jpeg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full15_frg35cse.png","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full16_t0oy1nvi.png","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full17_c2fy0i99.jpeg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full18_tj420zxl.jpeg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full19_grw1dvf1.jpeg","https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full20_vabiy15q.jpeg"],"affiliateUrl":"https://www.blibli.com/p/acmic-fc100-cfc100-kabel-data-charger-usb-type-c-100cm-fast-charging-cable-hitam/is--ACO-60021-00070-00001","canonicalUrl":"https://www.blibli.com/p/acmic-fc100-cfc100-kabel-data-charger-usb-type-c-100cm-fast-charging-cable-hitam/is--ACO-60021-00070-00001","badge":"Blibli Affiliate","features":["100 cm","USB Type-C","Fast charging"]},{"sequence":3,"id":"XIO-60022-01141-00001","canonicalProductId":"XIO-60022-01141-00001","name":"XIAOMI cable 6A type a to type c","brand":"XIAOMI","category":"Charging & Cable","images":["https://4phones.eu/cdn/shop/files/90000810874_A.jpg?v=1770447730","https://xlineparts.com/storage/images/products/1738406224_7799.jpg"],"affiliateUrl":"https://www.blibli.com/p/xiaomi-cable-6a-type-a-to-type-c/is--XIO-60022-01141-00001","canonicalUrl":"https://www.blibli.com/p/xiaomi-cable-6a-type-a-to-type-c/is--XIO-60022-01141-00001","badge":"Blibli Affiliate","features":["USB Type-C","6A","Fast charging"]},{"sequence":4,"id":"ACO-60021-00234-00001","canonicalProductId":"ACO-60021-00234-00001","name":"ACMIC PDC100 power delivery pd 100CM cable usb type c to usb type c","brand":"ACMIC","category":"Charging & Cable","images":["https://acmic.id/cdn/shop/files/CABLE_PDC100_1000x.jpg?v=1720595179"],"affiliateUrl":"https://www.blibli.com/p/acmic-pdc100-power-delivery-pd-100cm-cable-usb-type-c-to-usb-type-c/is--ACO-60021-00234-00001","canonicalUrl":"https://www.blibli.com/p/acmic-pdc100-power-delivery-pd-100cm-cable-usb-type-c-to-usb-type-c/is--ACO-60021-00234-00001","badge":"Blibli Affiliate","features":["100 cm","USB Type-C","Power Delivery"]}];

function sqlClient(){
  if(!DATABASE_URL) throw new Error("DATABASE_URL_NOT_CONFIGURED");
  return neon(DATABASE_URL);
}

async function ensureSchema(){
  const sql=sqlClient();
  await sql`
    CREATE TABLE IF NOT EXISTS catalog_products(
      sequence integer NOT NULL,
      id text PRIMARY KEY,
      canonical_product_id text NOT NULL,
      name text NOT NULL,
      brand text NOT NULL,
      category text NOT NULL,
      images jsonb NOT NULL DEFAULT '[]'::jsonb,
      affiliate_url text NOT NULL,
      canonical_url text,
      badge text NOT NULL DEFAULT 'Blibli Affiliate',
      features jsonb NOT NULL DEFAULT '[]'::jsonb,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS catalog_meta(
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  const seeded=await sql`SELECT value FROM catalog_meta WHERE key='seeded' LIMIT 1`;
  if(!seeded.length){
    for(const p of SEED){
      await sql`
        INSERT INTO catalog_products(
          sequence,id,canonical_product_id,name,brand,category,images,
          affiliate_url,canonical_url,badge,features,active,updated_at
        ) VALUES(
          ${p.sequence},${p.id},${p.canonicalProductId},${p.name},${p.brand},${p.category},
          ${JSON.stringify(p.images)}::jsonb,${p.affiliateUrl},${p.canonicalUrl},${p.badge},
          ${JSON.stringify(p.features)}::jsonb,true,now()
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    await sql`
      INSERT INTO catalog_meta(key,value) VALUES('seeded','1')
      ON CONFLICT (key) DO UPDATE SET value='1',updated_at=now()
    `;
  }
  return sql;
}

function rowToProduct(row:any){
  return {
    sequence:Number(row.sequence),
    id:row.id,
    canonicalProductId:row.canonical_product_id,
    name:row.name,
    brand:row.brand,
    category:row.category,
    images:Array.isArray(row.images)?row.images:[],
    affiliateUrl:row.affiliate_url,
    canonicalUrl:row.canonical_url,
    badge:row.badge,
    features:Array.isArray(row.features)?row.features:[]
  };
}

export async function GET(){
  try{
    const sql=await ensureSchema();
    const rows=await sql`
      SELECT sequence,id,canonical_product_id,name,brand,category,images,
             affiliate_url,canonical_url,badge,features
      FROM catalog_products
      WHERE active=true
      ORDER BY sequence ASC,created_at ASC
    `;
    return NextResponse.json({ok:true,products:rows.map(rowToProduct)},{headers:{"cache-control":"no-store"}});
  }catch(error){
    return NextResponse.json({ok:false,products:[],message:String(error)},{status:503});
  }
}

export async function POST(req:NextRequest){
  try{
    const origin=req.headers.get("origin")||"";
    if(origin && !origin.includes("skill-fusion-admin")){
      return NextResponse.json({ok:false,message:"Origin blocked"},{status:403});
    }
    const body=await req.json();
    const items=Array.isArray(body?.products)?body.products:[body?.product].filter(Boolean);
    if(!items.length) return NextResponse.json({ok:false,message:"No products"},{status:400});

    const sql=await ensureSchema();
    for(const p of items){
      if(!p?.id||!p?.affiliateUrl) continue;
      await sql`
        INSERT INTO catalog_products(
          sequence,id,canonical_product_id,name,brand,category,images,
          affiliate_url,canonical_url,badge,features,active,updated_at
        ) VALUES(
          ${Number(p.sequence)||1},${p.id},${p.canonicalProductId||p.id},${p.name||"Produk Blibli"},
          ${p.brand||"TECH"},${p.category||"Charging & Cable"},${JSON.stringify(p.images||[])}::jsonb,
          ${p.affiliateUrl},${p.canonicalUrl||null},${p.badge||"Blibli Affiliate"},
          ${JSON.stringify(p.features||[])}::jsonb,true,now()
        )
        ON CONFLICT (id) DO UPDATE SET
          sequence=EXCLUDED.sequence,
          canonical_product_id=EXCLUDED.canonical_product_id,
          name=EXCLUDED.name,
          brand=EXCLUDED.brand,
          category=EXCLUDED.category,
          images=CASE WHEN jsonb_array_length(EXCLUDED.images)>0 THEN EXCLUDED.images ELSE catalog_products.images END,
          affiliate_url=EXCLUDED.affiliate_url,
          canonical_url=COALESCE(EXCLUDED.canonical_url,catalog_products.canonical_url),
          badge=EXCLUDED.badge,
          features=CASE WHEN jsonb_array_length(EXCLUDED.features)>0 THEN EXCLUDED.features ELSE catalog_products.features END,
          active=true,
          updated_at=now()
      `;
    }
    const rows=await sql`
      SELECT sequence,id,canonical_product_id,name,brand,category,images,
             affiliate_url,canonical_url,badge,features
      FROM catalog_products WHERE active=true ORDER BY sequence ASC,created_at ASC
    `;
    return NextResponse.json({ok:true,products:rows.map(rowToProduct)});
  }catch(error){
    return NextResponse.json({ok:false,message:String(error)},{status:500});
  }
}

export async function DELETE(req:NextRequest){
  try{
    const origin=req.headers.get("origin")||"";
    if(origin && !origin.includes("skill-fusion-admin")){
      return NextResponse.json({ok:false,message:"Origin blocked"},{status:403});
    }
    const id=req.nextUrl.searchParams.get("id");
    if(!id) return NextResponse.json({ok:false,message:"id required"},{status:400});
    const sql=await ensureSchema();
    await sql`DELETE FROM catalog_products WHERE id=${id}`;
    return NextResponse.json({ok:true});
  }catch(error){
    return NextResponse.json({ok:false,message:String(error)},{status:500});
  }
}
