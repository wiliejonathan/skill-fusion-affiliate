"use client";

import { Heart, Scale, Star, TrendingUp } from "lucide-react";
import type { Product } from "@/lib/products";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

type Props = {
  product: Product;
  wished: boolean;
  compared: boolean;
  onWishlist: (id: string) => void;
  onCompare: (id: string) => void;
};

export default function ProductCard(props: Props) {
  const p = props.product;
  const discount = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

  return (
    <article className="product-card">
      <div className="product-visual">
        <span className="product-icon">{p.icon}</span>
        <span className="product-badge">{p.badge}</span>
        <div className="card-actions">
          <button className={props.wished ? "icon-btn active" : "icon-btn"} onClick={() => props.onWishlist(p.id)} aria-label="Wishlist">
            <Heart size={17} fill={props.wished ? "currentColor" : "none"} />
          </button>
          <button className={props.compared ? "icon-btn active" : "icon-btn"} onClick={() => props.onCompare(p.id)} aria-label="Compare">
            <Scale size={17} />
          </button>
        </div>
      </div>

      <div className="product-body">
        <div className="product-meta"><span>{p.brand}</span><span>{p.category}</span></div>
        <h3>{p.name}</h3>

        <div className="rating-row">
          <span className="rating"><Star size={14} fill="currentColor" /> {p.rating.toFixed(1)}</span>
          <span>{p.reviews.toLocaleString("id-ID")} ulasan</span>
        </div>

        <div className="score-row">
          <span className="score-pill">Skill Fusion {p.skillScore}/100</span>
          <span className="trend"><TrendingUp size={13} /> {p.trendScore}</span>
        </div>

        <div className="feature-list">
          {p.features.map((x) => <span key={x}>{x}</span>)}
        </div>

        <div className="price-block">
          <strong>{rupiah.format(p.price)}</strong>
          <div>
            {p.originalPrice ? <span className="old-price">{rupiah.format(p.originalPrice)}</span> : null}
            {discount > 0 ? <span className="discount">-{discount}%</span> : null}
          </div>
        </div>

        <button className="cta-btn" type="button">Lihat Penawaran</button>
      </div>
    </article>
  );
}
