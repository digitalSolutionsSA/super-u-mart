import React, { useState, useMemo, useEffect } from "react";
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

  const SHOP_CATEGORY_ORDER = useMemo(
    () => [
      "Kitchen and Home",
      "Tools & Hardware",
      "Electronics & Gaming",
      "Baby Kids & Toys",
      "Sports & Outdoor",
      "Car Accessories",
      "Bathroom & Accessories",
      "Gardening",
      "Lights & Solar",
      "Computers & Peripherals",
      "Cellphones & Tablets",
      "Cameras & Accessories",
    ],
    []
  );

  // Canonical aliases for messy stored values coming from DB/admin
  const CATEGORY_ALIASES = useMemo(
    () => ({
      "kitchen-and-home": [
        "kitchen-and-home",
        "kitchen-home",
        "kitchen",
        "home",
        "kitchen-appliances",
        "kitchen-appliance",
        "kitchenappliances",
      ],
      "tools-and-hardware": [
        "tools-and-hardware",
        "tools-hardware",
        "tools",
        "hardware",
        "tool",
      ],
      "electronics-and-gaming": [
        "electronics-and-gaming",
        "electronics-gaming",
        "electronics",
        "gaming",
        "electronic-and-gaming",
      ],
      "baby-kids-and-toys": [
        "baby-kids-and-toys",
        "baby-kids-toys",
        "baby-kids-toy",
        "baby-toys",
        "kids-and-toys",
        "kids-toys",
        "toys",
        "toy",
      ],
      "sports-and-outdoor": [
        "sports-and-outdoor",
        "sports-outdoor",
        "sport-and-outdoor",
        "sport-outdoor",
        "sports",
        "outdoor",
      ],
      "car-accessories": [
        "car-accessories",
        "car-accessory",
        "automotive",
        "auto-accessories",
        "vehicle-accessories",
      ],
      "lights-and-solar": [
        "lights-and-solar",
        "lights-solar",
        "lighting-and-solar",
        "lighting-solar",
        "lights",
        "solar",
      ],
      "computers-and-peripherals": [
        "computers-and-peripherals",
        "computer-and-peripherals",
        "computers-peripherals",
        "computer-peripherals",
        "computers",
        "computer",
        "peripherals",
      ],
      "bathroom-and-accessories": [
        "bathroom-and-accessories",
        "bathroom-accessories",
        "bathroom-and-accessory",
        "bathroom",
        "accessories",
        "bathroom-&-accessories",
      ],
      "gardening": [
        "gardening",
        "garden",
        "gardens",
        "garden-tools",
        "garden-supplies",
      ],
      "cellphones-and-tablets": [
        "cellphones-and-tablets",
        "cellphone-and-tablets",
        "cellphones-tablets",
        "cellphone-tablets",
        "cellphones",
        "cellphone",
        "phones-and-tablets",
        "phones-tablets",
        "mobile-and-tablets",
        "mobiles-and-tablets",
      ],
      "cameras-and-accessories": [
        "cameras-and-accessories",
        "camera-and-accessories",
        "cameras-accessories",
        "camera-accessories",
        "camera",
        "cameras",
      ],
    }),
    []
  );

  const normalizeCategoryKey = (value: any) => {
    const key = slugify(String(value ?? ""));
    if (!key) return "";

    if (CATEGORY_ALIASES[key as keyof typeof CATEGORY_ALIASES]) return key;

    for (const [canonical, aliases] of Object.entries(CATEGORY_ALIASES)) {
      if (aliases.includes(key)) return canonical;
    }

    return key;
  };

  const getProductBarcode = (product: any) => {
    const possibleValues = [
      product?.barcode,
      product?.barcode_number,
      product?.barcodeNumber,
      product?.barCode,
      product?.ean,
      product?.upc,
      product?.code,
    ];

    const found = possibleValues.find(
      (value) => value !== null && value !== undefined && String(value).trim() !== ""
    );

    return found ? String(found).trim() : "";
  };

  const allowedCategories = useMemo(() => {
    const byKey = new Map<string, any>();

    for (const c of (categories as any[]) || []) {
      const nameKey = normalizeCategoryKey(c?.name);
      const idKey = normalizeCategoryKey(c?.id);

      if (nameKey && !byKey.has(nameKey)) byKey.set(nameKey, c);
      if (idKey && !byKey.has(idKey)) byKey.set(idKey, c);
    }

    return SHOP_CATEGORY_ORDER.map((name) => {
      const key = normalizeCategoryKey(name);
      const found = byKey.get(key);

      if (found) {
        return {
          ...found,
          id: found?.id ?? key,
          name,
          icon: found?.icon ?? "•",
          key,
        };
      }

      return {
        id: key,
        name,
        icon: "•",
        key,
      };
    });
  }, [categories, SHOP_CATEGORY_ORDER]);

  const rawCategoryFilter = searchParams.get("category") || "";

  const categoryKey = useMemo(() => {
    return rawCategoryFilter ? normalizeCategoryKey(rawCategoryFilter) : "";
  }, [rawCategoryFilter]);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const updateSearchParams = (nextCategoryKey: string, nextQuery: string) => {
    const next: Record<string, string> = {};

    if (nextCategoryKey) next.category = nextCategoryKey;
    if (nextQuery.trim()) next.q = nextQuery.trim();

    setSearchParams(next);
  };

  const setCategory = (catKey: string) => {
    updateSearchParams(normalizeCategoryKey(catKey), searchQuery);
  };

  const productMatchesCategory = (product: any, selectedKey: string) => {
    if (!selectedKey) return true;

    const rawValues = [
      product?.category,
      product?.categoryId,
      product?.category_id,
      product?.categoryName,
      product?.category_name,
      product?.categorySlug,
      product?.category_slug,
      product?.category?.id,
      product?.category?.name,
      product?.category?.slug,
    ];

    const normalizedValues = rawValues
      .flatMap((value) => {
        if (value == null) return [];
        if (Array.isArray(value)) return value;
        return [value];
      })
      .map((value) => normalizeCategoryKey(value))
      .filter(Boolean);

    return normalizedValues.includes(selectedKey);
  };

  const getProductPrice = (product: any) => {
    const directPrice = Number(product?.price ?? 0);
    if (Number.isFinite(directPrice) && directPrice > 0) return directPrice;

    const centsPrice = Number(product?.price_cents ?? 0);
    if (Number.isFinite(centsPrice) && centsPrice > 0) return centsPrice / 100;

    return 0;
  };

  const filtered = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : [];
    list = list.filter(Boolean);

    if (categoryKey) {
      list = list.filter((p: any) => productMatchesCategory(p, categoryKey));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p: any) => {
        const name = String(p?.name ?? "").toLowerCase();
        const desc = String(p?.description ?? "").toLowerCase();
        const barcode = getProductBarcode(p).toLowerCase();

        return name.includes(q) || desc.includes(q) || barcode.includes(q);
      });
    }

    list = list.filter((p: any) => getProductPrice(p) <= priceMax);

    if (sortBy === "price-asc") {
      list.sort((a: any, b: any) => getProductPrice(a) - getProductPrice(b));
    } else if (sortBy === "price-desc") {
      list.sort((a: any, b: any) => getProductPrice(b) - getProductPrice(a));
    } else if (sortBy === "name") {
      list.sort((a: any, b: any) =>
        String(a?.name ?? "").localeCompare(String(b?.name ?? ""))
      );
    } else if (sortBy === "stock") {
      list.sort((a: any, b: any) => Number(b?.stock ?? 0) - Number(a?.stock ?? 0));
    }

    return list;
  }, [products, categoryKey, searchQuery, priceMax, sortBy]);

  const activeCategoryName = useMemo(() => {
    if (!categoryKey) return "All Products";
    const found = allowedCategories.find((cat: any) => cat.key === categoryKey);
    return found?.name ?? "Products";
  }, [categoryKey, allowedCategories]);

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
      <Header
        onSearch={(q) => {
          setSearchQuery(q);
          updateSearchParams(categoryKey, q);
        }}
      />

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
          boxSizing: "border-box",
        }}
      >
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
                const active = categoryKey === cat.key;

                return (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
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
                    <span>{cat?.icon || "•"}</span>
                    {cat?.name}
                  </button>
                );
              })}
            </div>

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

        <main>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              gap: 16,
              flexWrap: "wrap",
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
                minWidth: 150,
              }}
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A-Z</option>
              <option value="stock">Most in Stock</option>
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <input
              value={searchQuery}
              onChange={(e) => {
                const next = e.target.value;
                setSearchQuery(next);
                updateSearchParams(categoryKey, next);
              }}
              placeholder="Search products by name, barcode, or description..."
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
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "#f97316";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "#e2e8f0";
              }}
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: 20,
                alignItems: "stretch",
              }}
            >
              {filtered.map((product: any, index: number) => {
                if (!product) return null;

                const barcode = getProductBarcode(product);

                return (
                  <ProductCard
                    key={product.id ?? barcode ?? index}
                    product={{
                      ...product,
                      sku: barcode || "",
                    }}
                    onView={setSelectedProduct}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Footer />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}