export type ProductVariant={name:string;values:string[]};

export type Product={
  sequence:number;
  id:string;
  name:string;
  brand:string;
  category:string;
  images:string[];
  affiliateUrl:string;
  canonicalProductId:string;
  badge:string;
  features:string[];
  price?:string|null;
  currency?:string|null;
  description?:string|null;
  priceUpdatedAt?:string|null;
  pickupPointCode?:string|null;
  variants?:ProductVariant[];
};

export const PRODUCT_CATEGORY_ORDER=[
  "Kabel Data & Charging",
  "Charger & Adapter",
  "Power Bank",
  "Smartphone",
  "Feature Phone",
  "Tablet",
  "TWS & Earbuds",
  "Earphone Kabel",
  "Smartwatch",
  "Smartband",
  "Baterai HP",
  "Aksesori Smartwatch",
  "Aksesori TWS",
  "Aksesori Smartphone"
] as const;

export function inferProductCategory(product:Pick<Product,"name"|"category"|"features">){
  const name=String(product?.name||"").toLowerCase();
  const features=Array.isArray(product?.features)?product.features.join(" ").toLowerCase():"";
  const text=(name+" "+features).replace(/[_/]+/g," ").replace(/\s+/g," ").trim();

  const watchContext=/\b(watch|smartwatch|smart\s*band|smartband|garmin|fit\s*3|fit3|venu|gt\s*6|gt6|iwatch)\b/i.test(text);
  const accessory=/\b(strap|wristband|tali\s+jam|screen\s*protector|anti\s+gores|tempered\s+glass|case|casing|cover|bumper)\b/i.test(text);

  if(accessory&&watchContext) return "Aksesori Smartwatch";
  if(/\b(case|casing|cover)\b/i.test(text)&&/\b(tws|airpods?|earbuds?|buds\b|earphone)\b/i.test(text)) return "Aksesori TWS";
  if(/\b(wrist\s+strap|phone\s+strap|casetify)\b/i.test(text)) return "Aksesori Smartphone";

  if(/\b(power\s*bank|powerbank|portable\s+power\s+bank)\b/i.test(text)) return "Power Bank";
  if(/\b(galaxy\s+tab|redmi\s+pad|poco\s+pad|xpad|motopad|tablet|ipad\b|pad\s+se\b|pad\s+2\b|tab\s+s\d|tab\s+a\d)\b/i.test(text)) return "Tablet";

  if(/\bearphone\b/i.test(text)&&!/\b(tws|wireless|bluetooth|buds|freebuds|freeclip|airpods)\b/i.test(text)) return "Earphone Kabel";
  if(/\b(airpods?|earbuds?|headset|tws|buds\b|freebuds|freeclip|enco\s+buds|soundcore\s+r\d+i|wireless\s+earphone|bluetooth\s+earphone)\b/i.test(text)||/\bearphone\b.*\b(wireless|bluetooth)\b/i.test(text)) return "TWS & Earbuds";

  if(/\b(smartband|smart\s*band|galaxy\s+fit|huawei\s+band)\b/i.test(text)) return "Smartband";
  if(/\b(smartwatch|smart\s*watch|watch\s+fit|watch\s+gt|redmi\s+watch|gt\s+watch|forerunner)\b/i.test(text)) return "Smartwatch";

  if(/\b(baterai|battery|batre|batrai|batrei)\b/i.test(text)) return "Baterai HP";
  if(/\b(nokia\s+(?:105|110|150)|feature\s*phone|handphone\s+jadul)\b/i.test(text)) return "Feature Phone";

  const smartphoneModel=
    /\b(smartphone|hp\s+oppo|galaxy\s+(?:a|s)\d{1,2}\b|poco\s+[xc]\d|redmi\s+a\d|realme\s+(?:c|note|p)\d|oppo\s+a\d|huawei\s+pura\s+\d|pura\s+\d{2}|villaon\s+v\d)\b/i.test(text)
    ||/\binfinix\s+(?:hot|smart|note)\s*\d+/i.test(text);
  const smartphoneSpec=
    /\b(?:4|6|8|12)\s*(?:gb)?\s+(?:64|128|256|512)\s*(?:gb)?\b/i.test(text)
    ||/\b(?:64|128|256|512)\s*gb\b/i.test(text);
  if(
    smartphoneModel||
    (smartphoneSpec&&/\b(infinix|realme|poco|redmi|xiaomi|oppo|samsung|huawei|villaon|galaxy)\b/i.test(text))
  ) return "Smartphone";

  if(/\b(travel\s+adapter|wall\s+charger|kepala\s+charger|charger\s+kit|gan\s+charger|adaptor|adapter|charger\s+super\s+fast|super\s+fast\s+charging\s+\d+w)\b/i.test(text)) return "Charger & Adapter";
  if(/\b(kabel|cable|charging\s+cable|data\s+cable|usb\s+[ac]\s+to|type\s*c\s+to|lightning\s+cable)\b/i.test(text)) return "Kabel Data & Charging";

  if(accessory) return "Aksesori Smartphone";
  return "Lainnya";
}

export function getAvailableProductCategories(items:Product[]){
  const found=new Set(items.map(inferProductCategory));
  const ordered=PRODUCT_CATEGORY_ORDER.filter(item=>found.has(item));
  const extras=Array.from(found)
    .filter(item=>!PRODUCT_CATEGORY_ORDER.includes(item as (typeof PRODUCT_CATEGORY_ORDER)[number]))
    .sort((a,b)=>a.localeCompare(b));
  return ["Semua",...ordered,...extras];
}

export function getProductCategoryCounts(items:Product[]){
  const counts:Record<string,number>={Semua:items.length};
  for(const item of items){
    const category=inferProductCategory(item);
    counts[category]=(counts[category]||0)+1;
  }
  return counts;
}

// Kept for compatibility with older components; Marketplace builds its actual
// filter options dynamically from the live catalog.
export const categories=["Semua",...PRODUCT_CATEGORY_ORDER];

export const products:Product[]=[
  {
    "sequence": 1,
    "id": "ACO-60021-00244-00014",
    "canonicalProductId": "ACO-60021-00244-00014",
    "name": "ACMIC Braided Line Kabel Data Charger 100cm Fast Charging Cable GC100 / GL100 / GM100",
    "brand": "ACMIC",
    "category": "Charging & Cable",
    "images": [
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full45_njeqi5ul.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full15_ph0p14k5.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full16_mwsi08wd.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full17_fecq856n.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full18_gr5fkrpk.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full44_k26116c9.jpg"
    ],
    "affiliateUrl": "https://s.blibli.com/GNtk/0qrtsw3f",
    "badge": "Blibli Affiliate",
    "features": [
      "100 cm",
      "Fast charging"
    ],
    "price": null,
    "currency": null
  },
  {
    "sequence": 2,
    "id": "ACO-60021-00070-00001",
    "canonicalProductId": "ACO-60021-00070-00001",
    "name": "ACMIC FC100 CFC100 kabel data charger usb type c 100CM fast charging cable hitam",
    "brand": "ACMIC",
    "category": "Charging & Cable",
    "images": [
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full14_ge6ro4m0.jpeg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full15_frg35cse.png",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full16_t0oy1nvi.png",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full17_c2fy0i99.jpeg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full18_tj420zxl.jpeg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full19_grw1dvf1.jpeg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-3937306/acmic_acmic_fc100_kabel_data_charger_usb_type_c_100cm_fast_charging_cable_-_hitam_full20_vabiy15q.jpeg"
    ],
    "affiliateUrl": "https://s.blibli.com/GNtk/nppiag7f",
    "badge": "Blibli Affiliate",
    "features": [
      "100 cm",
      "USB Type-C",
      "Fast charging"
    ],
    "price": null,
    "currency": null
  },
  {
    "sequence": 3,
    "id": "XIO-60022-01141-00001",
    "canonicalProductId": "XIO-60022-01141-00001",
    "name": "XIAOMI cable 6A type a to type c",
    "brand": "XIAOMI",
    "category": "Charging & Cable",
    "images": [
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full02_cc3scl4a.jpeg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full03_hrw4dzk1.jpeg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full04_rw5y2lhf.jpeg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-180935468/xiaomi_xiaomi_cable_6a_type_a_to_type_c_full05_q6u0ao56.jpeg"
    ],
    "affiliateUrl": "https://s.blibli.com/GNtk/5qzuieiw",
    "badge": "Blibli Affiliate",
    "features": [
      "USB Type-C",
      "6A",
      "Fast charging"
    ],
    "price": null,
    "currency": null
  },
  {
    "sequence": 4,
    "id": "ACO-60021-00234-00001",
    "canonicalProductId": "ACO-60021-00234-00001",
    "name": "ACMIC PDC100 power delivery pd 100CM cable usb type c to usb type c",
    "brand": "ACMIC",
    "category": "Charging & Cable",
    "images": [
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full01_nhva0kf2.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full01_gyux63fu.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full02_tax0h4ac.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full03_ulrs28kp.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full04_vs6zuqs1.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full05_qvrkqpgn.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full06_q4432wpc.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-92774063/acmic_acmic_pdc100_power_delivery_-pd-_100cm_cable_usb_type_c_to_usb_type_c_full07_ln9qkabt.jpg"
    ],
    "affiliateUrl": "https://s.blibli.com/GNtk/gd0wp7zz",
    "badge": "Blibli Affiliate",
    "features": [
      "100 cm",
      "USB Type-C",
      "Power Delivery"
    ],
    "price": null,
    "currency": null
  },
  {
    "sequence": 5,
    "id": "ACO-60021-00122-00005",
    "canonicalProductId": "ACO-60021-00122-00005",
    "name": "ACMIC CFC100 usb type c fast charging cable kabel data charger 100 cm",
    "brand": "ACMIC",
    "category": "Charging & Cable",
    "images": [
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full02_r5kwu2kd.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full03_lksk36kw.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full01_qypmsyee.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full04_pyp47xtt.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full05_d1dlpkjc.jpg",
      "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-6370783/acmic_acmic_cfc100_usb_type_c_fast_charging_cable_kabel_data_charger_-100_cm-_full06_mpxrk7fj.jpg"
    ],
    "affiliateUrl": "https://s.blibli.com/GNtk/8394nrit",
    "badge": "Blibli Affiliate",
    "features": [
      "100 cm",
      "USB Type-C",
      "Fast charging"
    ],
    "price": null,
    "currency": null
  }
];
