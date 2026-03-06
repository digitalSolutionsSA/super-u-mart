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

function normalizeCategoryId(raw?: string): CategoryId | "Uncategorized" {
  const v = String(raw ?? "").trim();
  if (!v) return "Uncategorized";

  const direct = PERMANENT_CATEGORIES.find((c) => c.id === v);
  if (direct) return direct.id;

  const lower = v.toLowerCase();
  const byName = PERMANENT_CATEGORIES.find((c) => c.name.toLowerCase() === lower);
  if (byName) return byName.id;

  const simplified = lower.replace(/&/g, "and").replace(/\s+/g, " ").trim();
  const byLoose = PERMANENT_CATEGORIES.find(
    (c) =>
      c.name
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/\s+/g, " ")
        .trim() === simplified
  );
  if (byLoose) return byLoose.id;

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

  const categories = useMemo(() => {
    return [...PERMANENT_CATEGORIES.map((c) => c.id), "Uncategorized"] as Array<
      CategoryId | "Uncategorized"
    >;
  }, []);

  const [categoryOn, setCategoryOn] = useState<Record<string, boolean>>({});

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

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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
        return name.includes(q) || desc.includes(q) || catLabel.includes(q) || catRaw.includes(q);
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
    categories.forEach((c) => (next[String(c)] = on));
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
      setActionError(e?.message || "Failed to update On Sale.");
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

  return (
    <div className="w-full">
      <div className="flex gap-6">
        <aside
          className="w-[320px] shrink-0 rounded-2xl p-5"
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
              placeholder="Search products..."
              className="w-full bg-transparent outline-none text-white placeholder:text-white/45"
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
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

        <main className="flex-1 min-w-0">
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

          <div className="mt-5 space-y-6">
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
                          {categoryLabel(catId as any)}
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
                          className="grid grid-cols-[1fr_140px_110px_220px_170px] gap-4 pb-3 text-xs font-extrabold uppercase tracking-wide"
                          style={{
                            color: "#41506b",
                            borderBottom: "1px solid rgba(17,29,94,0.10)",
                          }}
                        >
                          <div>Product</div>
                          <div>Price</div>
                          <div>Stock</div>
                          <div>Quick Toggles</div>
                          <div className="text-right">Actions</div>
                        </div>

                        <div className="mt-3 space-y-3">
                          {items.map((p) => {
                            const price = typeof p.price === "number" ? p.price : 0;
                            const stock = typeof p.stock === "number" ? p.stock : 0;
                            const rowBusy = busyId === String(p.id);

                            return (
                              <div
                                key={p.id}
                                className="grid grid-cols-[1fr_140px_110px_220px_170px] gap-4 items-start rounded-2xl px-4 py-3"
                                style={{
                                  background: "rgba(17,29,94,0.06)",
                                  border: "1px solid rgba(17,29,94,0.08)",
                                }}
                              >
                                <div className="min-w-0">
                                  <div
                                    className="font-extrabold truncate"
                                    style={{ color: "#0f1b55" }}
                                  >
                                    {p.name}
                                  </div>
                                  <div className="text-sm truncate" style={{ color: "#475569" }}>
                                    {p.description || "No description yet"}
                                  </div>
                                </div>

                                <div className="font-extrabold pt-0.5" style={{ color: "#0f1b55" }}>
                                  {moneyZAR(price)}
                                </div>

                                <div className="pt-0.5">
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

                                <div className="pt-0.5 flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    disabled={rowBusy}
                                    onClick={() => toggleProductOnSale(p)}
                                    className="px-3 py-1 rounded-full text-xs font-extrabold transition disabled:opacity-60"
                                    style={{
                                      background: p.onSale
                                        ? "rgba(249,115,22,0.18)"
                                        : "rgba(17,29,94,0.10)",
                                      border: "1px solid rgba(17,29,94,0.12)",
                                      color: "#0f1b55",
                                    }}
                                    title="Toggle On Sale"
                                  >
                                    {p.onSale ? "On Sale: Yes" : "On Sale: No"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={rowBusy}
                                    onClick={() => toggleProductFeatured(p)}
                                    className="px-3 py-1 rounded-full text-xs font-extrabold transition disabled:opacity-60"
                                    style={{
                                      background: p.featured
                                        ? "rgba(34,197,94,0.16)"
                                        : "rgba(17,29,94,0.10)",
                                      border: "1px solid rgba(17,29,94,0.12)",
                                      color: "#0f1b55",
                                    }}
                                    title="Toggle Featured"
                                  >
                                    {p.featured ? "Featured: Yes" : "Featured: No"}
                                  </button>

                                  {rowBusy && (
                                    <span className="text-xs font-bold" style={{ color: "#64748b" }}>
                                      Saving…
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => onEdit(p.id)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-extrabold transition hover:brightness-110"
                                    style={{
                                      background: "rgba(255,255,255,0.65)",
                                      border: "1px solid rgba(17,29,94,0.12)",
                                      color: "#0f1b55",
                                    }}
                                  >
                                    <Pencil size={16} />
                                    Edit
                                  </button>

                                  <button
                                    onClick={() => onDelete(p.id)}
                                    disabled={rowBusy}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-extrabold transition hover:brightness-110 disabled:opacity-60"
                                    style={{
                                      background: "rgba(255,0,0,0.08)",
                                      border: "1px solid rgba(255,0,0,0.20)",
                                      color: "#b91c1c",
                                    }}
                                  >
                                    <Trash2 size={16} />
                                    Delete
                                  </button>
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

          <div className="mt-6 text-white/55 text-sm">
            Uses <code className="text-white/80">product.onSale</code>,{" "}
            <code className="text-white/80">product.featured</code> and{" "}
            <code className="text-white/80">product.stock</code>.
          </div>
        </main>
      </div>
    </div>
  );
}