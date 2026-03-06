import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";

// IMPORTANT:
// Fix this import path to wherever your supabase client actually lives.
// Common options in projects:
//   "../lib/supabase"
//   "../supabaseClient"
//   "../utils/supabase"
//   "../lib/supabaseClient"
import { supabase } from "../lib/supabase"; // <-- if this path is wrong, Vite will 500

const PERMANENT_CATEGORIES = [
  { id: "kitchen-appliances", name: "Kitchen Appliances", icon: "🍳" },
  { id: "tools", name: "Tools", icon: "🛠️" },
  { id: "electronics-gaming", name: "Electronics & Gaming", icon: "🎮" },
  { id: "toys", name: "Toys", icon: "🧸" },
  { id: "sports-outdoor", name: "Sports & Outdoor", icon: "🏕️" },
  { id: "car-accessories", name: "Car Accessories", icon: "🚗" },
  { id: "lights-solar", name: "Lights & Solar", icon: "💡" },
] as const;

type UIProduct = {
  id: string | number;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  onSale?: boolean;
  featured?: boolean;
  image_url?: string | null;
  images?: any;
};

function norm(v: any) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

function matchCategoryId(productCategory: any): (typeof PERMANENT_CATEGORIES)[number]["id"] | null {
  const pc = norm(productCategory);
  if (!pc) return null;

  const byId = PERMANENT_CATEGORIES.find((c) => norm(c.id) === pc);
  if (byId) return byId.id;

  const byName = PERMANENT_CATEGORIES.find((c) => norm(c.name) === pc);
  if (byName) return byName.id;

  return null;
}

export default function CategoriesPage() {
  const [selectedProduct, setSelectedProduct] = useState<UIProduct | null>(null);
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      // Change "products" if your table name differs
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (error) {
        console.error("Supabase SELECT products error:", error);
        setProducts([]);
        setLoading(false);
        return;
      }

      const mapped: UIProduct[] = (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? "",
        category: r.category ?? r.category_id ?? "",
        price:
          typeof r.price === "number"
            ? r.price
            : typeof r.price_cents === "number"
              ? r.price_cents / 100
              : 0,
        onSale: !!(r.onSale ?? r.on_sale),
        featured: !!(r.featured ?? r.is_featured),
        image_url: r.image_url ?? null,
        images: r.images ?? null,
      }));

      setProducts(mapped);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const productsByCat = useMemo(() => {
    const map = new Map<string, UIProduct[]>();
    PERMANENT_CATEGORIES.forEach((c) => map.set(c.id, []));

    for (const p of products) {
      const id = matchCategoryId(p.category);
      if (!id) continue;
      map.get(id)!.push(p);
    }

    return map;
  }, [products]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc", fontFamily: "Barlow, sans-serif" }}>
      <Header />

      <div style={{ maxWidth: 1200, margin: "40px auto", padding: "0 24px", width: "100%" }}>
        <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: 40, color: "#1e293b", marginBottom: 8 }}>
          All Categories
        </h1>

        <p style={{ color: "#64748b", marginBottom: 24 }}>
          Browse our full wholesale range by category
        </p>

        <div style={{ marginBottom: 24, padding: "10px 12px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontSize: 13, fontWeight: 700 }}>
          {loading ? "Loading products from Supabase..." : `Products loaded: ${products.length}`}
        </div>

        {PERMANENT_CATEGORIES.map((cat) => {
          const catProducts = productsByCat.get(cat.id) ?? [];

          return (
            <div key={cat.id} style={{ marginBottom: 56 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 28, color: "#1e293b", display: "flex", alignItems: "center", gap: 12 }}>
                  <span>{cat.icon}</span> {cat.name}
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8" }}>
                    ({catProducts.length})
                  </span>
                </h2>

                <Link to={`/shop?category=${cat.id}`} style={{ color: "#f97316", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
                  View all →
                </Link>
              </div>

              {catProducts.length === 0 ? (
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 18, color: "#64748b", fontWeight: 600 }}>
                  No products yet in this category.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
                  {catProducts.slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product as any} onView={setSelectedProduct as any} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Footer />
      {selectedProduct && <ProductModal product={selectedProduct as any} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}