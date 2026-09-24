export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  skillScore: number;
  trendScore: number;
  badge: string;
  icon: string;
  features: string[];
};

export const categories = [
  "Semua","Smartphone","Laptop","Smart Home","AI Gadget","Gaming","Audio","Charging","Accessories","Storage","Networking"
];

export const products: Product[] = [
  {id:"sf-001",name:"Nexode 100W GaN Charger",brand:"UGREEN",category:"Charging",price:749000,originalPrice:899000,rating:4.8,reviews:1200,skillScore:91,trendScore:86,badge:"Best Value",icon:"⚡",features:["100W","GaN","USB-C PD"]},
  {id:"sf-002",name:"AI Voice Recorder",brand:"PLAUD",category:"AI Gadget",price:2499000,originalPrice:2799000,rating:4.7,reviews:340,skillScore:94,trendScore:97,badge:"Trending",icon:"🤖",features:["AI summary","Transcription","Portable"]},
  {id:"sf-003",name:"ROG Compact Gaming Laptop",brand:"ASUS",category:"Laptop",price:17999000,originalPrice:19999000,rating:4.8,reviews:270,skillScore:90,trendScore:82,badge:"Performance",icon:"💻",features:["High refresh","Dedicated GPU","SSD"]},
  {id:"sf-004",name:"Wi-Fi 7 Smart Router",brand:"TP-Link",category:"Networking",price:2899000,originalPrice:3299000,rating:4.7,reviews:180,skillScore:89,trendScore:88,badge:"New Tech",icon:"📡",features:["Wi-Fi 7","Multi-gig","Mesh ready"]},
  {id:"sf-005",name:"Qi2 Magnetic Power Bank",brand:"Baseus",category:"Accessories",price:629000,originalPrice:749000,rating:4.8,reviews:980,skillScore:88,trendScore:90,badge:"Popular",icon:"🔋",features:["Qi2","Magnetic","USB-C"]},
  {id:"sf-006",name:"Smart Home Hub Pro",brand:"Xiaomi",category:"Smart Home",price:899000,originalPrice:999000,rating:4.6,reviews:640,skillScore:87,trendScore:78,badge:"Smart Home",icon:"🏠",features:["Automation","Wi-Fi","Bluetooth"]},
  {id:"sf-007",name:"Portable NVMe SSD 1TB",brand:"Samsung",category:"Storage",price:1699000,originalPrice:1899000,rating:4.9,reviews:2100,skillScore:92,trendScore:84,badge:"Top Rated",icon:"💾",features:["1TB","NVMe","USB-C"]},
  {id:"sf-008",name:"Mechanical Keyboard 75%",brand:"Keychron",category:"Gaming",price:1599000,originalPrice:1799000,rating:4.9,reviews:1500,skillScore:90,trendScore:92,badge:"Creator Pick",icon:"⌨️",features:["75%","Hot-swap","Wireless"]},
  {id:"sf-009",name:"ANC Wireless Earbuds",brand:"Anker",category:"Audio",price:1299000,originalPrice:1499000,rating:4.7,reviews:3200,skillScore:89,trendScore:85,badge:"Best Seller",icon:"🎧",features:["ANC","Bluetooth","Long battery"]},
  {id:"sf-010",name:"Flagship Android Smartphone",brand:"Samsung",category:"Smartphone",price:18999000,originalPrice:20499000,rating:4.8,reviews:890,skillScore:93,trendScore:95,badge:"Flagship",icon:"📱",features:["5G","OLED","AI camera"]},
  {id:"sf-011",name:"MX Productivity Mouse",brand:"Logitech",category:"Accessories",price:1499000,originalPrice:1649000,rating:4.9,reviews:4100,skillScore:91,trendScore:80,badge:"Work Pick",icon:"🖱️",features:["Ergonomic","Multi-device","USB-C"]},
  {id:"sf-012",name:"65W Compact GaN Charger",brand:"Anker",category:"Charging",price:599000,originalPrice:699000,rating:4.8,reviews:2600,skillScore:90,trendScore:87,badge:"Travel Pick",icon:"🔌",features:["65W","GaN","USB-C PD"]}
];

export const brands = Array.from(new Set(products.map(function(p){return p.brand;}))).sort();
