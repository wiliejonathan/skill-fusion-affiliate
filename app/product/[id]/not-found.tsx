import Link from "next/link";

export default function NotFound(){
  return <main className="detail-not-found">
    <div>
      <span>404</span>
      <h1>Produk tidak ditemukan</h1>
      <p>Produk mungkin sudah dihapus atau link detail sudah berubah.</p>
      <Link href="/">Kembali ke katalog</Link>
    </div>
  </main>;
}
