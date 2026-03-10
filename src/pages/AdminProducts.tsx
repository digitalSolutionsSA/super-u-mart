import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Search as SearchIcon,
  ChevronDown,
  ChevronUp,
  Tag,
  Minus,
} from "lucide-react";
import { useStore } from "../context/StoreContext";

type Product = {
  id: string | number;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  stock?: number;
  onSale?: boolean;
  featured?: boolean;
  barcode?: string;
  image?: string;
  imageUrl?: string;
  image_url?: string;
  images?: string[];
};

const ACCENT_ORANGE = "#f97316";

const PERMANENT_CATEGORIES = [
  { id: "kitchen-appliances", name: "Kitchen Appliances" },
  { id: "tools", name: "Tools" },
  { id: "electronics-gaming", name: "Electronics & Gaming" },
  { id: "toys", name: "Baby Kids & Toys" },
  { id: "sports-outdoor", name: "Sports & Outdoor" },
  { id: "car-accessories", name: "Car Accessories" },
  { id: "lights-solar", name: "Lights & Solar" },
  { id: "cellphones-tablets", name: "Cellphones & Tablets" },
  { id: "bathroom-accessories", name: "Bathroom & Accessories" },
  { id: "gardening", name: "Gardening" },
  { id: "computers-peripherals", name: "Computers & Peripherals" },
  { id: "cameras-accessories", name: "Cameras & Accessories" },
] as const;

type CategoryId = (typeof PERMANENT_CATEGORIES)[number]["id"];

function moneyZAR(val: number) {
  const n = Number.isFinite(val) ? val : 0;
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" })
    .format(n)
    .replace("ZAR", "R")
    .replace("R ", "R");
}

function TogglePill({
  on,
  onClick,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "white",
      }}
      aria-pressed={on}
    >
      {on ? "ON" : "OFF"}
    </button>
  );
}

function normalizeLooseCategory(value?: string) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCategoryId(raw?: string): CategoryId | "Uncategorized" {
  const v = String(raw ?? "").trim();
  if (!v) return "Uncategorized";

  const lower = normalizeLooseCategory(v);

  const direct = PERMANENT_CATEGORIES.find((c) => c.id === v);
  if (direct) return direct.id;

  const aliases: Record<CategoryId, string[]> = {
    "kitchen-appliances": [
      "kitchen appliances",
      "kitchen appliance",
      "kitchen and home",
      "kitchen home",
      "kitchen",
      "home",
      "kitchen appliances",
    ],
    tools: [
      "tools",
      "tool",
      "tools and hardware",
      "tools hardware",
      "hardware",
    ],
    "electronics-gaming": [
      "electronics gaming",
      "electronics and gaming",
      "electronics",
      "gaming",
      "electronic and gaming",
    ],
    toys: [
      "baby kids toys",
      "baby kids and toys",
      "toys",
      "toy",
      "baby toys",
    ],
    "sports-outdoor": [
      "sports outdoor",
      "sports and outdoor",
      "sport outdoor",
      "sport and outdoor",
      "sports",
      "outdoor",
    ],
    "car-accessories": [
      "car accessories",
      "car accessory",
      "automotive",
      "auto accessories",
      "vehicle accessories",
    ],
    "lights-solar": [
      "lights solar",
      "lights and solar",
      "lighting solar",
      "lighting and solar",
      "lights",
      "solar",
    ],
    "cellphones-tablets": [
      "cellphones tablets",
      "cellphones and tablets",
      "cellphone tablets",
      "cellphone and tablets",
      "phones tablets",
      "mobile phones tablets",
    ],
    "bathroom-accessories": [
      "bathroom accessories",
      "bathroom and accessories",
      "bathroom accessory",
      "bathroom",
      "bath accessories",
    ],
    gardening: [
      "gardening",
      "garden",
      "gardens",
      "garden tools",
      "garden supplies",
    ],
    "computers-peripherals": [
      "computers peripherals",
      "computers and peripherals",
      "computer peripherals",
      "computer and peripherals",
      "computers",
      "computer",
      "peripherals",
    ],
    "cameras-accessories": [
      "cameras accessories",
      "cameras and accessories",
      "camera accessories",
      "camera and accessories",
      "camera",
      "cameras",
    ],
  };

  for (const category of PERMANENT_CATEGORIES) {
    if (normalizeLooseCategory(category.name) === lower) return category.id;
    if (aliases[category.id].includes(lower)) return category.id;
  }

  return "Uncategorized";
}

function categoryLabel(id: CategoryId | "Uncategorized"): string {
  if (id === "Uncategorized") return "Uncategorized";
  return PERMANENT_CATEGORIES.find((c) => c.id === id)?.name ?? "Uncategorized";
}

export default function AdminProducts() {
  const navigate = useNavigate();

  const {
    products,
    updateProduct,
    deleteProduct,
    loadingProducts,
  } = useStore() as unknown as {
    products: Product[];
    updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    loadingProducts?: boolean;
  };

  const [query, setQuery] = useState("");
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});

  const categories = useMemo(() => {
    return [...PERMANENT_CATEGORIES.map((c) => c.id), "Uncategorized"] as Array<
      CategoryId | "Uncategorized"
    >;
  }, []);

  const [categoryOn, setCategoryOn] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCategoryOn((prev) => {
      const next: Record<string, boolean> = { ...prev };
      categories.forEach((c) => {
        const key = String(c);
        if (next[key] === undefined) next[key] = true;
      });
      Object.keys(next).forEach((k) => {
        if (!categories.map(String).includes(k)) delete next[k];
      });
      return next;
    });
  }, [categories]);

  useEffect(() => {
    setStockDrafts((prev) => {
      const next = { ...prev };
      (products || []).forEach((p) => {
        const key = String(p.id);
        next[key] = String(typeof p.stock === "number" ? p.stock : 0);
      });
      return next;
    });
  }, [products]);

  useEffect(() => {
    setCollapsed((prev) => {
      const next = { ...prev };
      categories.forEach((c) => {
        const key = String(c);
        if (next[key] === undefined) next[key] = false;
      });
      Object.keys(next).forEach((k) => {
        if (!categories.map(String).includes(k)) delete next[k];
      });
      return next;
    });
  }, [categories]);

  const toggleOnSaleOnly = () => {
    setOnSaleOnly((prev) => {
      const next = !prev;
      if (next) setFeaturedOnly(false);
      return next;
    });
  };

  const toggleFeaturedOnly = () => {
    setFeaturedOnly((prev) => {
      const next = !prev;
      if (next) setOnSaleOnly(false);
      return next;
    });
  };

  const totalCount = (products || []).length;

  const filtered = useMemo(() => {
    let list = [...(products || [])];

    list = list.filter((p) => {
      const catId = normalizeCategoryId(p.category);
      return categoryOn[String(catId)] !== false;
    });

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const catLabel = categoryLabel(normalizeCategoryId(p.category)).toLowerCase();
        const catRaw = String(p.category ?? "").toLowerCase();
        const barcode = String(p.barcode ?? "").toLowerCase();

        return (
          name.includes(q) ||
          desc.includes(q) ||
          catLabel.includes(q) ||
          catRaw.includes(q) ||
          barcode.includes(q)
        );
      });
    }

    if (onSaleOnly) list = list.filter((p) => !!p.onSale);
    if (featuredOnly) list = list.filter((p) => !!p.featured);

    return list;
  }, [products, categoryOn, query, onSaleOnly, featuredOnly]);

  const shownCount = filtered.length;

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();

    filtered.forEach((p) => {
      const catId = normalizeCategoryId(p.category);
      const groupKey = String(catId);
      if (!map.has(groupKey)) map.set(groupKey, []);
      map.get(groupKey)!.push(p);
    });

    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      map.set(k, arr);
    }

    const order = new Map<string, number>();
    PERMANENT_CATEGORIES.forEach((c, idx) => order.set(c.id, idx));
    order.set("Uncategorized", 999);

    return Array.from(map.entries()).sort((a, b) => {
      const oa = order.get(a[0]) ?? 998;
      const ob = order.get(b[0]) ?? 998;
      if (oa !== ob) return oa - ob;
      return a[0].localeCompare(b[0]);
    });
  }, [filtered]);

  const setAllCategories = (on: boolean) => {
    const next: Record<string, boolean> = {};
    categories.forEach((c) => {
      next[String(c)] = on;
    });
    setCategoryOn(next);
  };

  const toggleCategory = (catId: string) => {
    setCategoryOn((prev) => ({ ...prev, [catId]: !(prev[catId] !== false) }));
  };

  const clearFilters = () => {
    setQuery("");
    setOnSaleOnly(false);
    setFeaturedOnly(false);
    setAllCategories(true);
  };

  const onAddProduct = () => navigate("/admin/products/new");

  const onEdit = (id: Product["id"]) => {
    navigate(`/admin/products/edit/${id}`);
  };

  const onDelete = async (id: Product["id"]) => {
    setActionError(null);
    const sure = window.confirm("Delete this product permanently?");
    if (!sure) return;

    try {
      setBusyId(String(id));
      await deleteProduct(String(id));
    } catch (e: any) {
      console.error(e);
      setActionError(e?.message || "Failed to delete product (Supabase said no).");
    } finally {
      setBusyId(null);
    }
  };

  const toggleProductOnSale = async (p: Product) => {
    setActionError(null);
    try {
      setBusyId(String(p.id));
      await updateProduct(String(p.id), { onSale: !p.onSale });
    } catch (e: any) {
      console.error(e);
      setActionError(e?.message || "Failed to update Sale.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleProductFeatured = async (p: Product) => {
    setActionError(null);
    try {
      setBusyId(String(p.id));
      await updateProduct(String(p.id), { featured: !p.featured });
    } catch (e: any) {
      console.error(e);
      setActionError(e?.message || "Failed to update Featured.");
    } finally {
      setBusyId(null);
    }
  };

  const setStockDraft = (id: string, value: string) => {
    if (/^\d*$/.test(value)) {
      setStockDrafts((prev) => ({ ...prev, [id]: value }));
    }
  };

  const adjustStock = (id: string, amount: number) => {
    setStockDrafts((prev) => {
      const current = Number(prev[id] ?? "0");
      const next = Math.max(0, current + amount);
      return { ...prev, [id]: String(next) };
    });
  };

  const saveStock = async (p: Product) => {
    setActionError(null);

    const id = String(p.id);
    const nextStock = Math.max(0, Number(stockDrafts[id] ?? 0));
    const currentStock = typeof p.stock === "number" ? p.stock : 0;

    if (nextStock === currentStock) return;

    try {
      setBusyId(id);
      await updateProduct(id, { stock: nextStock });
    } catch (e: any) {
      console.error(e);
      setActionError(e?.message || "Failed to update stock.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full overflow-hidden" style={{ height: "calc(100vh - 120px)" }}>
      <div className="flex gap-6 h-full min-h-0">
        <aside
          className="w-[320px] shrink-0 rounded-2xl p-5 overflow-y-auto min-h-0"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 18px 55px rgba(0,0,0,0.18)",
          }}
        >
          <div className="text-white font-extrabold text-lg">Search</div>

          <div
            className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <SearchIcon size={18} className="text-white/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products or barcode..."
              className="w-full bg-transparent outline-none text-white placeholder:text-white/45"
            />
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide text-white"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              {shownCount} SHOWN
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide text-white"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              {totalCount} TOTAL
            </span>
          </div>

          <div className="mt-7 text-white font-extrabold text-lg">Filter by</div>

          <div
            className="mt-3 rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-white font-extrabold">On Sale only</div>
                <div className="text-white/65 text-sm">Show discounted items only</div>
              </div>
              <TogglePill on={onSaleOnly} onClick={toggleOnSaleOnly} />
            </div>
          </div>

          <div
            className="mt-3 rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-white font-extrabold">Currently featured</div>
                <div className="text-white/65 text-sm">Show featured items only</div>
              </div>
              <TogglePill on={featuredOnly} onClick={toggleFeaturedOnly} />
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <div className="text-white font-extrabold text-lg">Categories</div>
            <div className="text-white/80 text-sm font-extrabold">
              <button
                type="button"
                onClick={() => setAllCategories(true)}
                className="hover:text-white transition"
              >
                All
              </button>
              <span className="mx-2 text-white/35">|</span>
              <button
                type="button"
                onClick={() => setAllCategories(false)}
                className="hover:text-white transition"
              >
                None
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {categories.map((catId) => {
              const key = String(catId);
              const isOn = categoryOn[key] !== false;

              const countInCat = (products || []).filter(
                (p) => String(normalizeCategoryId(p.category)) === key
              ).length;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCategory(key)}
                  className="w-full text-left rounded-2xl px-4 py-3 transition hover:brightness-110"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-white font-extrabold">{categoryLabel(catId)}</div>
                      <div className="text-white/60 text-sm">{countInCat} items</div>
                    </div>

                    <span
                      className="px-3 py-1 rounded-full text-xs font-extrabold uppercase"
                      style={{
                        background: isOn ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.10)",
                        border: "1px solid rgba(255,255,255,0.16)",
                        color: "white",
                      }}
                    >
                      {isOn ? "ON" : "OFF"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={clearFilters}
            className="mt-6 w-full rounded-2xl py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:brightness-110 active:scale-[0.99]"
            style={{
              background: `linear-gradient(90deg, ${ACCENT_ORANGE} 0%, #ff8a2a 55%, ${ACCENT_ORANGE} 100%)`,
              boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            Clear Filters
          </button>
        </aside>

        <main className="flex-1 min-w-0 h-full min-h-0 overflow-y-auto pr-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-white font-extrabold text-3xl">Products</div>
              <div className="text-white/70 mt-1">
                Products are grouped by category. Use the sidebar to search and filter.
              </div>
            </div>

            <button
              onClick={onAddProduct}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold text-white transition hover:brightness-110 active:scale-[0.99]"
              style={{
                background: ACCENT_ORANGE,
                boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>

          {actionError && (
            <div
              className="mt-4 rounded-xl px-4 py-3 text-sm font-bold"
              style={{
                background: "rgba(255,0,0,0.10)",
                border: "1px solid rgba(255,0,0,0.20)",
                color: "#fecaca",
              }}
            >
              {actionError}
            </div>
          )}

          {loadingProducts && (
            <div className="mt-6 text-white/70 text-sm">Loading products…</div>
          )}

          <div className="mt-5 space-y-6 pb-4">
            {!loadingProducts && grouped.length === 0 ? (
              <section
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
                }}
              >
                <div className="px-6 py-5">
                  <div className="font-extrabold text-lg text-[#0f1b55]">
                    No products match your filters.
                  </div>
                  <div className="text-[#334155] text-sm mt-1">
                    Try adjusting your search or filter settings.
                  </div>
                </div>
              </section>
            ) : (
              grouped.map(([catId, items]) => {
                const isCollapsed = !!collapsed[catId];
                const saleCount = items.filter((p) => !!p.onSale).length;

                return (
                  <section
                    key={catId}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.92)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
                    }}
                  >
                    <div
                      className="px-6 py-5 flex items-center justify-between gap-4"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,247,255,0.98) 100%)",
                        borderBottom: "1px solid rgba(17,29,94,0.10)",
                      }}
                    >
                      <div>
                        <div className="font-extrabold text-lg text-[#0f1b55]">
                          {categoryLabel(catId as CategoryId | "Uncategorized")}
                        </div>
                        <div className="text-[#334155] text-sm">
                          {items.length} product{items.length === 1 ? "" : "s"}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide"
                          style={{
                            background: "rgba(249,115,22,0.14)",
                            border: "1px solid rgba(249,115,22,0.28)",
                            color: "#8a3b00",
                          }}
                        >
                          <Tag size={14} />
                          {saleCount} ON SALE
                        </span>

                        <button
                          onClick={() => setCollapsed((p) => ({ ...p, [catId]: !p[catId] }))}
                          className="p-2 rounded-xl transition hover:brightness-110"
                          style={{
                            background: "rgba(17,29,94,0.06)",
                            border: "1px solid rgba(17,29,94,0.10)",
                          }}
                          aria-label={isCollapsed ? "Expand category" : "Collapse category"}
                        >
                          {isCollapsed ? (
                            <ChevronDown size={18} className="text-[#0f1b55]" />
                          ) : (
                            <ChevronUp size={18} className="text-[#0f1b55]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="p-6">
                        <div
                          className="grid grid-cols-[minmax(0,1.7fr)_140px_170px_260px] gap-4 pb-3 text-xs font-extrabold uppercase tracking-wide"
                          style={{
                            color: "#41506b",
                            borderBottom: "1px solid rgba(17,29,94,0.10)",
                          }}
                        >
                          <div>Product</div>
                          <div>Price</div>
                          <div>Stock</div>
                          <div>Quick Toggles</div>
                        </div>

                        <div className="mt-3 space-y-3">
                          {items.map((p) => {
                            const price = typeof p.price === "number" ? p.price : 0;
                            const stock = typeof p.stock === "number" ? p.stock : 0;
                            const rowBusy = busyId === String(p.id);
                            const draftStock = stockDrafts[String(p.id)] ?? String(stock);
                            const parsedDraftStock = Math.max(0, Number(draftStock || 0));
                            const stockChanged = parsedDraftStock !== stock;

                            const productImage =
                              p.image ||
                              p.imageUrl ||
                              p.image_url ||
                              (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "");

                            return (
                              <div
                                key={p.id}
                                className="rounded-2xl px-4 py-4"
                                style={{
                                  background: "rgba(17,29,94,0.06)",
                                  border: "1px solid rgba(17,29,94,0.08)",
                                }}
                              >
                                <div className="flex items-start gap-4 min-w-0">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-4 min-w-0">
                                      <div className="min-w-0 flex-[1.7]">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div
                                            className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"
                                            style={{
                                              background: "rgba(17,29,94,0.08)",
                                              border: "1px solid rgba(17,29,94,0.10)",
                                            }}
                                          >
                                            {productImage ? (
                                              <img
                                                src={productImage}
                                                alt={p.name}
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <div
                                                className="h-full w-full flex items-center justify-center text-[10px] font-extrabold uppercase text-center px-1"
                                                style={{ color: "#64748b" }}
                                              >
                                                No Image
                                              </div>
                                            )}
                                          </div>

                                          <div className="min-w-0 flex-1">
                                            <div
                                              className="font-extrabold truncate text-[15px]"
                                              style={{ color: "#0f1b55" }}
                                              title={p.name}
                                            >
                                              {p.name}
                                            </div>
                                            <div
                                              className="text-sm truncate"
                                              style={{ color: "#475569" }}
                                              title={p.description || "No description yet"}
                                            >
                                              {p.description || "No description yet"}
                                            </div>
                                            <div
                                              className="text-xs mt-1 truncate"
                                              style={{ color: "#64748b" }}
                                              title={p.barcode || "No barcode"}
                                            >
                                              Barcode: {p.barcode || "-"}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-4 flex items-center gap-3">
                                          <button
                                            type="button"
                                            disabled={rowBusy}
                                            onClick={() => toggleProductFeatured(p)}
                                            className="h-9 px-4 rounded-full text-xs font-extrabold flex items-center justify-center"
                                            style={{
                                              background: "rgba(17,29,94,0.10)",
                                              border: "1px solid rgba(17,29,94,0.12)",
                                              color: "#0f1b55",
                                            }}
                                            title="Toggle Featured"
                                          >
                                            {p.featured ? "Featured: Yes" : "Featured: No"}
                                          </button>

                                          <button
                                            type="button"
                                            disabled={rowBusy}
                                            onClick={() => toggleProductOnSale(p)}
                                            className="h-9 px-4 rounded-full text-xs font-extrabold flex items-center justify-center"
                                            style={{
                                              background: "rgba(17,29,94,0.10)",
                                              border: "1px solid rgba(17,29,94,0.12)",
                                              color: "#0f1b55",
                                            }}
                                            title="Toggle Sale"
                                          >
                                            {p.onSale ? "Sale: Yes" : "Sale: No"}
                                          </button>

                                          <button
                                            type="button"
                                            disabled={rowBusy}
                                            onClick={() => onEdit(p.id)}
                                            className="h-9 px-4 rounded-full text-xs font-extrabold flex items-center gap-1 justify-center"
                                            style={{
                                              background: "rgba(255,255,255,0.8)",
                                              border: "1px solid rgba(17,29,94,0.12)",
                                              color: "#0f1b55",
                                            }}
                                            title="Edit Product"
                                          >
                                            <Pencil size={13} />
                                            Edit
                                          </button>

                                          <button
                                            type="button"
                                            disabled={rowBusy}
                                            onClick={() => onDelete(p.id)}
                                            className="h-9 px-4 rounded-full text-xs font-extrabold flex items-center gap-1 justify-center"
                                            style={{
                                              background: "rgba(255,0,0,0.08)",
                                              border: "1px solid rgba(255,0,0,0.20)",
                                              color: "#b91c1c",
                                            }}
                                            title="Delete Product"
                                          >
                                            <Trash2 size={13} />
                                            Delete
                                          </button>
                                        </div>
                                      </div>

                                      <div
                                        className="w-[140px] shrink-0 pt-1 font-extrabold text-[15px]"
                                        style={{ color: "#0f1b55" }}
                                      >
                                        {moneyZAR(price)}
                                      </div>

                                      <div className="w-[170px] shrink-0 pt-0.5">
                                        <span
                                          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold"
                                          style={{
                                            background:
                                              stock <= 0
                                                ? "rgba(239,68,68,0.14)"
                                                : stock <= 5
                                                ? "rgba(249,115,22,0.16)"
                                                : "rgba(34,197,94,0.16)",
                                            border:
                                              stock <= 0
                                                ? "1px solid rgba(239,68,68,0.24)"
                                                : stock <= 5
                                                ? "1px solid rgba(249,115,22,0.24)"
                                                : "1px solid rgba(34,197,94,0.24)",
                                            color:
                                              stock <= 0
                                                ? "#b91c1c"
                                                : stock <= 5
                                                ? "#c2410c"
                                                : "#166534",
                                          }}
                                        >
                                          {stock <= 0 ? "Out of stock" : `${stock} in stock`}
                                        </span>
                                      </div>

                                      <div className="w-[260px] shrink-0 pt-0.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <button
                                            type="button"
                                            disabled={rowBusy}
                                            onClick={() => adjustStock(String(p.id), -1)}
                                            className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-xl transition disabled:opacity-60"
                                            style={{
                                              background: "rgba(17,29,94,0.08)",
                                              border: "1px solid rgba(17,29,94,0.12)",
                                              color: "#0f1b55",
                                            }}
                                          >
                                            <Minus size={16} />
                                          </button>

                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            value={draftStock}
                                            disabled={rowBusy}
                                            onChange={(e) =>
                                              setStockDraft(String(p.id), e.target.value)
                                            }
                                            className="h-9 w-[82px] shrink-0 rounded-xl text-center font-extrabold outline-none"
                                            style={{
                                              background: "white",
                                              border: "1px solid rgba(17,29,94,0.14)",
                                              color: "#0f1b55",
                                            }}
                                          />

                                          <button
                                            type="button"
                                            disabled={rowBusy}
                                            onClick={() => adjustStock(String(p.id), 1)}
                                            className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-xl transition disabled:opacity-60"
                                            style={{
                                              background: "rgba(17,29,94,0.08)",
                                              border: "1px solid rgba(17,29,94,0.12)",
                                              color: "#0f1b55",
                                            }}
                                          >
                                            <Plus size={16} />
                                          </button>

                                          <button
                                            type="button"
                                            disabled={rowBusy || !stockChanged}
                                            onClick={() => saveStock(p)}
                                            className="h-9 px-4 shrink-0 rounded-xl text-xs font-extrabold transition disabled:opacity-50 flex items-center justify-center"
                                            style={{
                                              background: stockChanged
                                                ? "rgba(17,29,94,0.08)"
                                                : "rgba(17,29,94,0.04)",
                                              border: "1px solid rgba(17,29,94,0.12)",
                                              color: "#0f1b55",
                                            }}
                                          >
                                            Save
                                          </button>
                                        </div>

                                        {rowBusy && (
                                          <span
                                            className="mt-2 inline-block text-xs font-bold"
                                            style={{ color: "#64748b" }}
                                          >
                                            Saving…
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>

          <div className="mt-6 text-white/55 text-sm pb-2">
            Uses <code className="text-white/80">product.onSale</code>,{" "}
            <code className="text-white/80">product.featured</code>,{" "}
            <code className="text-white/80">product.stock</code> and{" "}
            <code className="text-white/80">product.barcode</code>.
          </div>
        </main>
      </div>
    </div>
  );
}