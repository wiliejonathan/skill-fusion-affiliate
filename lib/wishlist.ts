export const WISHLIST_KEY="skill-fusion:wishlist";

export function readWishlist():string[]{
  if(typeof window==="undefined") return [];
  try{
    const raw=window.localStorage.getItem(WISHLIST_KEY);
    const parsed=raw?JSON.parse(raw):[];
    return Array.isArray(parsed)?parsed.filter((x):x is string=>typeof x==="string"):[];
  }catch{
    return [];
  }
}

export function writeWishlist(ids:string[]){
  if(typeof window==="undefined") return;
  const unique=[...new Set(ids)];
  window.localStorage.setItem(WISHLIST_KEY,JSON.stringify(unique));
  window.dispatchEvent(new CustomEvent("skillfusion:wishlist",{detail:unique}));
}

export function toggleWishlistId(id:string){
  const current=readWishlist();
  const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];
  writeWishlist(next);
  return next;
}
