export type Product={
  id:string;
  name:string;
  brand:string;
  category:string;
  images:string[];
  affiliateUrl:string;
  canonicalProductId:string;
  badge:string;
  features:string[];
};

export const categories=["Semua","Charging & Cable"];

export const products:Product[]=[{
  id:"ACO-60021-00244-00014",
  canonicalProductId:"ACO-60021-00244-00014",
  name:"ACMIC Braided Line Kabel Data Charger 100cm Fast Charging Cable GC100 / GL100 / GM100",
  brand:"ACMIC",
  category:"Charging & Cable",
  images:[
  "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full45_njeqi5ul.jpg",
  "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full15_ph0p14k5.jpg",
  "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full16_mwsi08wd.jpg",
  "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full17_fecq856n.jpg",
  "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//catalog-image/93/MTA-112494305/acmic_acmic_braided_line_kabel_data_fast_charging_iphone-type_c-micro_usb_1m_full18_gr5fkrpk.jpg",
  "https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-112494305/acmic_acmic_braided_line_kabel_data_charger_100cm_fast_charging_cable_-gc100-gl100-gm100-_full44_k26116c9.jpg"
],
  affiliateUrl:"https://s.blibli.com/GNtk/0qrtsw3f",
  badge:"Blibli Affiliate",
  features:["100 cm","Braided cable","Fast charging"]
}];
