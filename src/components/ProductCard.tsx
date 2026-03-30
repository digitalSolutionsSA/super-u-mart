import React from "react";
import { ShoppingCart, Eye, Package } from "lucide-react";
import { Product } from "../types";
import { useStore } from "../context/StoreContext";

interface ProductCardProps {
  product?: Product | null;
  onView?: (product: Product) => void;
}

export default function ProductCard({ product, onView }: ProductCardProps) {
  const { addToCart } = useStore();

  if (!product) return null;

  const p: any = product;

  const productImage =
    p?.image ||
    p?.imageUrl ||
    p?.image_url ||
    (Array.isArray(p?.images) && p.images.length > 0 ? p.images[0] : "");

  const stockCount = Number(p?.stock || 0);
  const hasStock = stockCount > 0;
  const barcodeValue = String(p?.barcode || p?.sku || "").trim();
  const collectionOnly = Boolean(
    p?.collectionOnly === true ||
      p?.collection_only === true ||
      p?.collectiononly === true
  );

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasStock) return;
    addToCart(product, 1);
  };

  return (
    <div
      onClick={() => onView?.(product)}
      style={{
        background: "white",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(15, 23, 42, 0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 6px 18px rgba(15, 23, 42, 0.08)";
      }}
    >
      <div
        style={{
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: 12,
        }}
      >
        <div
          style={{
            width: "100%",
            height: 200,
            borderRadius: 10,
            background: "white",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img
            src={
              productImage ||
              "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80"
            }
            alt={p?.name || "Product"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80";
            }}
          />
        </div>
      </div>

      <div
        style={{
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
        }}
      >
        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>
          Barcode: {barcodeValue || "-"}
        </div>

        {collectionOnly && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              alignSelf: "flex-start",
              padding: "4px 10px",
              borderRadius: 999,
              background: "#fff7ed",
              border: "1px solid #fdba74",
              color: "#ea580c",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            Collection Only
          </div>
        )}

        <h3
          style={{
            margin: 0,
            fontSize: 17,
            lineHeight: 1.35,
            fontWeight: 800,
            color: "#0f172a",
            fontFamily: "Barlow, sans-serif",
            minHeight: 46,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {p?.name || "Untitled Product"}
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: hasStock ? "#64748b" : "#94a3b8",
            fontSize: 13,
          }}
        >
          <Package size={14} />
          <span>Stock: {stockCount}</span>
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#1a2e7a",
              fontFamily: "Barlow, sans-serif",
            }}
          >
            R{Number(p?.price || 0).toFixed(2)}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView?.(product);
              }}
              style={{
                border: "1px solid #e2e8f0",
                background: "white",
                color: "#334155",
                borderRadius: 8,
                padding: "10px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="View product"
            >
              <Eye size={16} />
            </button>

            <button
              onClick={handleAdd}
              disabled={!hasStock}
              style={{
                background: hasStock ? "#f97316" : "#cbd5e1",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 14px",
                cursor: hasStock ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 700,
                fontFamily: "Barlow, sans-serif",
              }}
            >
              <ShoppingCart size={15} />
              {collectionOnly ? "Collect" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}