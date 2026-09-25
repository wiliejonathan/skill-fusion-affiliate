export type Product={
  id:string;
  name:string;
  brand:string;
  category:string;
  affiliateUrl:string;
  canonicalProductId:string;
  badge:string;
  icon:string;
  features:string[];
};

export const categories=["Semua","Charging & Cable"];

export const products:Product[]=[{
  id:"ACO-60021-00244-00014",
  canonicalProductId:"ACO-60021-00244-00014",
  name:"ACMIC Braided Line Kabel Data Charger 100cm Fast Charging Cable GC100 / GL100 / GM100",
  brand:"ACMIC",
  category:"Charging & Cable",
  affiliateUrl:"https://s.blibli.com/GNtk/0qrtsw3f",
  badge:"Blibli Affiliate",
  icon:"🔌",
  features:["100 cm","Braided cable","Fast charging"]
}];
