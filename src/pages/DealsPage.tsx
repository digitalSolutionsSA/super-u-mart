import React, { useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import { useStore } from "../context/StoreContext";
import { Product } from "../types";

export default function DealsPage() {
  const { products } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const DARK_BLUE = "#111d5e";
  const ACCENT_ORANGE = "#f97316";

  const deals = useMemo(() => {
    const safe = Array.isArray(products) ? products : [];

    return safe.filter((p: any) => {
      const price = Number(p?.price ?? p?.price_cents ?? p?.priceCents ?? 0);
      const salePrice = Number(p?.salePrice ?? p?.sale_price ?? 0);
      const compareAt = Number(p?.compareAtPrice ?? p?.compare_at_price ?? 0);

      const tagStr = Array.isArray(p?.tags)
        ? p.tags.join(" ").toLowerCase()
        : String(p?.tags ?? "").toLowerCase();

      const flag =
        p?.onSale === true ||
        p?.isOnSale === true ||
        (salePrice > 0 && price > 0 && salePrice < price) ||
        (compareAt > 0 && price > 0 && compareAt > price) ||
        tagStr.includes("sale") ||
        tagStr.includes("deal") ||
        tagStr.includes("special");

      return Boolean(flag);
    });
  }, [products]);

  return (
    <>
      <Header />

      <div
        style={{
          minHeight: "90vh",
          position: "relative",
          backgroundImage: "url('/categories/warehouse-bg.png')", // ✅ from /public
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Blue overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(17, 29, 94, 0.85)",
          }}
        />

        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Hero */}
          <div style={{ padding: "50px 20px 20px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <h1 style={{ fontSize: 38, fontWeight: 900, marginBottom: 10, color: "white" }}>
                Deals & Specials
              </h1>
              <p style={{ color: "rgba(255,255,255,0.85)", maxWidth: 760 }}>
                Current wholesale specials and discounted bulk items. Stock moves fast,
                because humans love saving money almost as much as they love complaining.
              </p>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "30px 20px 60px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              {/* Summary bar */}
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: "16px 18px",
                  boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 22,
                }}
              >
                <div style={{ fontWeight: 700, color: "#111827" }}>
                  {deals.length} deal{deals.length === 1 ? "" : "s"} available
                </div>

                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Tip: Click a product to view details & add to cart.
                </div>
              </div>

              {/* Grid */}
              {deals.length === 0 ? (
                <div
                  style={{
                    background: "white",
                    borderRadius: 16,
                    padding: 30,
                    boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
                  }}
                >
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
                    No deals right now
                  </h3>
                  <p style={{ color: "#6b7280", marginBottom: 18 }}>
                    Either everything is already priced too well… or nobody marked any items as “on sale”.
                  </p>

                  <div
                    style={{
                      display: "inline-block",
                      background: ACCENT_ORANGE,
                      color: "white",
                      padding: "10px 14px",
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    Check back soon
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 18,
                  }}
                  className="deals-grid"
                >
                  {deals.map((p: any) => (
                    <div
                      key={p.id ?? p.slug ?? p.name}
                      onClick={() => setSelectedProduct(p)}
                      style={{ cursor: "pointer" }}
                    >
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      <Footer />

      {/* Responsive grid tweak */}
      <style>{`
        @media (max-width: 1100px) {
          .deals-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 780px) {
          .deals-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 480px) {
          .deals-grid { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        }
      `}</style>
    </>
  );
}