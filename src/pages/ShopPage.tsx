import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import { useStore } from "../context/StoreContext";
import { Product } from "../types";

function slugify(input: string) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ShopPage() {
  const { products, categories } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState("default");
  const [priceMax, setPriceMax] = useState(10000);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  // ✅ The ONLY 8 categories we show on Shop (match AdminProducts)
  // Use names as the source of truth, because your IDs are not reliable across seed/admin/supabase.
  const SHOP_CATEGORY_ORDER = useMemo(
    () => [
      "Kitchen Appliances",
      "Tools & Hardware",
      "Electronics & Gaming",
      "Toys",
      "Sports & Outdoor",
      "Car Accessories",
      "Lights & Solar",
      "Stationery",
    ],
    []
  );

  const SHOP_CATEGORY_KEYS = useMemo(
    () => new Set(SHOP_CATEGORY_ORDER.map((n) => slugify(n))),
    [SHOP_CATEGORY_ORDER]
  );

  // ✅ Build sidebar categories from store categories if possible,
  // but ALWAYS force exactly these 8, in this order.
  const allowedCategories = useMemo(() => {
    const byKey = new Map<string, any>();

    // Map what exists in your store by slug(name) OR slug(id)
    for (const c of categories as any[]) {
      const nameKey = slugify(c.name);
      const idKey = slugify(c.id);
      if (!byKey.has(nameKey)) byKey.set(nameKey, c);
      if (!byKey.has(idKey)) byKey.set(idKey, c);
    }

    // Force the 8 categories, using real objects if found, otherwise create fallbacks.
    return SHOP_CATEGORY_ORDER.map((name) => {
      const key = slugify(name);
      const found = byKey.get(key);

      if (found) return found;

      // fallback object if store doesn't have it (prevents "missing category" UI)
      return {
        id: key,
        name,
        icon: "•",
      };
    });
  }, [categories, SHOP_CATEGORY_ORDER]);

  // ✅ category from URL (store as slug so it stays stable)
  const rawCategoryFilter = searchParams.get("category") || "";

  const categoryKey = useMemo(() => {
    if (!rawCategoryFilter) return "";
    const key = slugify(rawCategoryFilter);
    return SHOP_CATEGORY_KEYS.has(key) ? key : "";
  }, [rawCategoryFilter, SHOP_CATEGORY_KEYS]);

  const setCategory = (catKey: string) => {
    if (catKey && !SHOP_CATEGORY_KEYS.has(slugify(catKey))) return;

    const q = searchParams.get("q") || "";
    if (!catKey) {
      setSearchParams(q ? { q } : {});
      return;
    }
    setSearchParams(q ? { category: catKey, q } : { category: catKey });
  };

  const filtered = useMemo(() => {
    let list = [...products] as any[];

    if (categoryKey) {
      list = list.filter((p) => {
        const pCatRaw = String(p.category ?? "");
        const pKey = slugify(pCatRaw);

        // match product.category against:
        // - the slug key (preferred)
        // - the human name slug
        // - the original raw string if they stored "Kitchen Appliances" etc.
        return pKey === categoryKey || slugify(pCatRaw) === categoryKey;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const name = String(p.name ?? "").toLowerCase();
        const desc = String(p.description ?? "").toLowerCase();
        const sku = String(p.sku ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q) || sku.includes(q);
      });
    }

    list = list.filter((p) => Number(p.price ?? 0) <= priceMax);

    if (sortBy === "price-asc") list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sortBy === "price-desc") list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sortBy === "name") list.sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
    else if (sortBy === "stock") list.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));

    return list;
  }, [products, categoryKey, searchQuery, priceMax, sortBy]);

  const activeCategoryName = useMemo(() => {
    if (!categoryKey) return "All Products";
    const found = SHOP_CATEGORY_ORDER.find((n) => slugify(n) === categoryKey);
    return found ?? "Products";
  }, [categoryKey, SHOP_CATEGORY_ORDER]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
        fontFamily: "Barlow, sans-serif",
      }}
    >
      <Header onSearch={(q) => setSearchQuery(q)} />

      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          padding: "32px 24px",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 28,
          flex: 1,
        }}
      >
        {/* Sidebar Filters */}
        <aside>
          <div
            style={{
              background: "white",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              position: "sticky",
              top: 120,
            }}
          >
            <div
              style={{
                background: "#1a2e7a",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <SlidersHorizontal size={16} color="white" />
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
                Filters
              </span>
            </div>

            {/* Categories */}
            <div style={{ padding: 18, borderBottom: "1px solid #f1f5f9" }}>
              <h4
                style={{
                  margin: "0 0 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "#94a3b8",
                }}
              >
                Category
              </h4>

              <button
                onClick={() => setCategory("")}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  marginBottom: 4,
                  background: !categoryKey ? "#f97316" : "transparent",
                  color: !categoryKey ? "white" : "#475569",
                  fontWeight: !categoryKey ? 700 : 400,
                  fontSize: 13,
                }}
              >
                All Products
              </button>

              {allowedCategories.map((cat: any) => {
                const key = slugify(cat.name);
                const active = categoryKey === key;

                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      marginBottom: 4,
                      background: active ? "#fff7ed" : "transparent",
                      color: active ? "#f97316" : "#475569",
                      fontWeight: active ? 700 : 400,
                      fontSize: 13,
                    }}
                  >
                    <span>{cat.icon}</span> {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Price range */}
            <div style={{ padding: 18 }}>
              <h4
                style={{
                  margin: "0 0 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "#94a3b8",
                }}
              >
                Max Price
              </h4>
              <input
                type="range"
                min={0}
                max={10000}
                step={50}
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f97316" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "#64748b",
                  marginTop: 4,
                }}
              >
                <span>R0</span>
                <span style={{ fontWeight: 700, color: "#f97316" }}>
                  R{priceMax.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main>
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "Barlow Condensed, sans-serif",
                  fontWeight: 800,
                  fontSize: 28,
                  color: "#1e293b",
                }}
              >
                {activeCategoryName}
              </h1>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
                {filtered.length} products found
              </p>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 13,
                fontFamily: "Barlow, sans-serif",
                color: "#475569",
                cursor: "pointer",
              }}
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
              <option value="stock">Most in Stock</option>
            </select>
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: 20 }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, SKU, or description..."
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "2px solid #e2e8f0",
                fontSize: 14,
                fontFamily: "Barlow, sans-serif",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (((e.target as HTMLInputElement).style.borderColor = "#f97316"))}
              onBlur={(e) => (((e.target as HTMLInputElement).style.borderColor = "#e2e8f0"))}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontFamily: "Barlow, sans-serif", color: "#475569" }}>
                No products found
              </h3>
              <p>Try changing your filters or search query.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 20 }}>
              {filtered.map((product: any) => (
                <ProductCard key={product.id} product={product} onView={setSelectedProduct} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}