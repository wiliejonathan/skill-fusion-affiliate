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
  "Power Bank",
  "Charging & Cable",
  "Charger & Adapter",
  "Smartwatch & Wearable",
  "Audio",
  "Smartphone & Tablet",
  "Computer & Peripheral",
  "Smart Home",
  "Networking & Storage",
  "Tech Accessories",
  "Other Tech"
] as const;

export function inferProductCategory(product:Pick<Product,"name"|"category"|"features">){
  const name=String(product?.name||"").toLowerCase();
  const features=Array.isArray(product?.features)?product.features.join(" ").toLowerCase():"";
  const stored=String(product?.category||"").trim();
  const storedLow=stored.toLowerCase();
  const text=(name+" "+features).replace(/[_/]+/g," ").replace(/\s+/g," ").trim();

  // Put the most specific product families first. Existing database rows were
  // historically stored as "Charging & Cable", so title/features are the
  // authoritative signal for classification.
  if(/\b(power\s*bank|powerbank|battery\s*pack|portable\s+charger)\b/i.test(text)) return "Power Bank";
  if(/\b(smart\s*watch|smartwatch|fitness\s*(?:band|tracker)|forerunner|apple\s*watch|galaxy\s*watch|amazfit|smart\s*band|garmin\s+(?:venu|vivo|instinct|fenix|epix))\b/i.test(text)) return "Smartwatch & Wearable";
  if(/\b(earbuds?|earphones?|headphones?|headsets?|tws|speaker|soundbar|microphone|audio)\b/i.test(text)) return "Audio";
  if(/\b(smartphone|handphone|mobile\s+phone|iphone\b|ipad\b|tablet\b|galaxy\s+[asz]\d|redmi\s+note|poco\s+[a-z0-9])\b/i.test(text)) return "Smartphone & Tablet";
  if(/\b(smart\s*home|smart\s*plug|smart\s*bulb|ip\s*camera|cctv|doorbell|robot\s*vacuum|vacuum\s*cleaner|air\s*purifier|smart\s*sensor)\b/i.test(text)) return "Smart Home";
  if(/\b(router|wi-?fi|modem|mesh\s*wifi|ethernet|network\s*switch|ssd|hdd|hard\s*drive|flash\s*drive|usb\s*drive|micro\s*sd|memory\s*card|nas\b)\b/i.test(text)) return "Networking & Storage";
  if(/\b(keyboard|mouse|monitor|laptop|notebook|webcam|gamepad|controller|usb\s*hub|type\s*c\s*hub|docking\s*station)\b/i.test(text)) return "Computer & Peripheral";
  if(/\b(kabel|cable|braided\s+line|data\s+charger|data\s+cable|lightning\s+cable|usb\s*[ac]\s*to|usb-?[ac]\s*to|type\s*-?c\s*to|c\s*to\s*c)\b/i.test(text)) return "Charging & Cable";
  if(/\b(gan\s*charger|wall\s*charger|travel\s*charger|wireless\s*charger|charging\s*station|charging\s*dock|car\s*charger|power\s*adapter|power\s*adaptor|adapter|adaptor|kepala\s*charger)\b/i.test(text)) return "Charger & Adapter";
  if(/\b(case|casing|cover|holder|stand|mount|screen\s*protector|tempered\s*glass|strap|stylus|sleeve|pouch)\b/i.test(text)) return "Tech Accessories";

  // Respect useful category metadata from Blibli, but normalize it into the
  // marketplace's compact product classes.
  if(/power\s*bank/i.test(storedLow)) return "Power Bank";
  if(/watch|wearable|fitness/i.test(storedLow)) return "Smartwatch & Wearable";
  if(/audio|earphone|headphone|speaker/i.test(storedLow)) return "Audio";
  if(/smartphone|handphone|tablet/i.test(storedLow)) return "Smartphone & Tablet";
  if(/smart\s*home|home\s*appliance/i.test(storedLow)) return "Smart Home";
  if(/network|storage|router|ssd|memory/i.test(storedLow)) return "Networking & Storage";
  if(/computer|peripheral|keyboard|mouse|laptop/i.test(storedLow)) return "Computer & Peripheral";
  if(/charger|adapter|adaptor/i.test(storedLow)&&!/cable|kabel/i.test(storedLow)) return "Charger & Adapter";
  if(/cable|kabel/i.test(storedLow)) return "Charging & Cable";
  if(/accessor/i.test(storedLow)) return "Tech Accessories";

  return "Other Tech";
}

export function getAvailableProductCategories(items:Product[]){
  const found=new Set(items.map(inferProductCategory));
  const ordered=PRODUCT_CATEGORY_ORDER.filter(item=>found.has(item));
  const extras=Array.from(found)
    .filter(item=>!PRODUCT_CATEGORY_ORDER.includes(item as (typeof PRODUCT_CATEGORY_ORDER)[number]))
    .sort((a,b)=>a.localeCompare(b));
  return ["Semua",...ordered,...extras];
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
