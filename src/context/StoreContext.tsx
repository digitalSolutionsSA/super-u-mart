import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product, Category, CartItem, Order } from "../types";
import { defaultCategories } from "../data/seedData";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";

interface StoreContextType {
  // Products
  products: Product[];
  addProduct: (p: Omit<Product, "id" | "createdAt">) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  clearProducts: () => Promise<void>;

  // Categories
  categories: Category[];
  addCategory: (c: Omit<Category, "id">) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Orders
  orders: Order[];
  placeOrder: (customer: Order["customer"], deliveryMethod: Order["deliveryMethod"]) => Order;
  updateOrderStatus: (id: string, status: Order["status"]) => void;

  // Auth
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  adminPassword: string;

  // Loading
  loadingProducts: boolean;
  loadingCategories: boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * ✅ Map Supabase product rows to your app Product type.
 */
function mapProductRow(row: any): Product {
  const price =
    typeof row.price === "number"
      ? row.price
      : typeof row.price_cents === "number"
        ? row.price_cents / 100
        : 0;

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    sku: String(row.sku ?? ""),
    barcode: String(row.barcode ?? ""),
    category: String(row.category ?? ""),
    price,
    stock: Number(row.stock ?? 0),
    image: row.image ?? row.image_url ?? null,
    images: row.images ?? null,
    featured: Boolean(row.featured ?? row.is_featured ?? false),
    onSale: Boolean(row.onSale ?? row.on_sale ?? false),
    salePrice:
      typeof row.sale_price === "number"
        ? row.sale_price
        : typeof row.salePrice === "number"
          ? row.salePrice
          : undefined,
    lengthCm:
      row.length_cm !== undefined && row.length_cm !== null
        ? Number(row.length_cm)
        : row.lengthCm !== undefined && row.lengthCm !== null
          ? Number(row.lengthCm)
          : undefined,
    widthCm:
      row.width_cm !== undefined && row.width_cm !== null
        ? Number(row.width_cm)
        : row.widthCm !== undefined && row.widthCm !== null
          ? Number(row.widthCm)
          : undefined,
    heightCm:
      row.height_cm !== undefined && row.height_cm !== null
        ? Number(row.height_cm)
        : row.heightCm !== undefined && row.heightCm !== null
          ? Number(row.heightCm)
          : undefined,
    weightKg:
      row.weight_kg !== undefined && row.weight_kg !== null
        ? Number(row.weight_kg)
        : row.weightKg !== undefined && row.weightKg !== null
          ? Number(row.weightKg)
          : undefined,
    createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
  } as Product;
}

function mapCategoryRow(row: any): Category {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    icon: row.icon ?? "•",
  } as Category;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [categories, setCategories] = useState<Category[]>(() =>
    loadLS("sum_categories", defaultCategories)
  );
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => loadLS("sum_orders", []));

  const [isAdmin, setIsAdmin] = useState(false);
  const adminPassword = "SuperUAdmin2024";

  useEffect(() => {
    localStorage.setItem("sum_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("sum_orders", JSON.stringify(orders));
  }, [orders]);

  const fetchProducts = async () => {
    setLoadingProducts(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase fetchProducts error:", error);
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    setProducts((data ?? []).map(mapProductRow));
    setLoadingProducts(false);
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.warn("⚠️ Supabase fetchCategories failed, using local categories:", error.message);
      setLoadingCategories(false);
      return;
    }

    setCategories((data ?? []).map(mapCategoryRow));
    setLoadingCategories(false);
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await Promise.all([fetchProducts(), fetchCategories()]);
      } catch (e) {
        console.error("❌ StoreProvider initial load error:", e);
      } finally {
        if (!alive) return;
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addProduct = async (p: Omit<Product, "id" | "createdAt">) => {
    const insertPayload: any = {
      name: p.name,
      description: p.description ?? "",
      sku: (p as any).sku ?? "",
      barcode: (p as any).barcode ?? "",
      category: p.category ?? "",
      stock: (p as any).stock ?? 0,
      image_url: (p as any).image ?? (p as any).imageUrl ?? (p as any).image_url ?? null,
      images: (p as any).images ?? null,
      featured: (p as any).featured ?? false,
      on_sale: (p as any).onSale ?? false,
      sale_price:
        (p as any).salePrice !== undefined && (p as any).salePrice !== ""
          ? Number((p as any).salePrice)
          : null,
      length_cm:
        (p as any).lengthCm !== undefined && (p as any).lengthCm !== ""
          ? Number((p as any).lengthCm)
          : null,
      width_cm:
        (p as any).widthCm !== undefined && (p as any).widthCm !== ""
          ? Number((p as any).widthCm)
          : null,
      height_cm:
        (p as any).heightCm !== undefined && (p as any).heightCm !== ""
          ? Number((p as any).heightCm)
          : null,
      weight_kg:
        (p as any).weightKg !== undefined && (p as any).weightKg !== ""
          ? Number((p as any).weightKg)
          : null,
    };

    if (typeof (p as any).price === "number") {
      insertPayload.price = (p as any).price;
      insertPayload.price_cents = Math.round((p as any).price * 100);
    }

    const { error } = await supabase.from("products").insert([insertPayload]);

    if (error) {
      console.error("❌ Supabase addProduct error:", error);
      throw error;
    }

    await fetchProducts();
  };

  const updateProduct = async (id: string, patch: Partial<Product>) => {
    const updatePayload: any = {};

    if (patch.name !== undefined) updatePayload.name = patch.name;
    if (patch.description !== undefined) updatePayload.description = patch.description;
    if ((patch as any).sku !== undefined) updatePayload.sku = (patch as any).sku;
    if ((patch as any).barcode !== undefined) updatePayload.barcode = (patch as any).barcode;
    if (patch.category !== undefined) updatePayload.category = patch.category;
    if ((patch as any).stock !== undefined) updatePayload.stock = (patch as any).stock;

    if ((patch as any).image !== undefined) updatePayload.image_url = (patch as any).image;
    if ((patch as any).imageUrl !== undefined) updatePayload.image_url = (patch as any).imageUrl;
    if ((patch as any).image_url !== undefined) updatePayload.image_url = (patch as any).image_url;

    if ((patch as any).images !== undefined) updatePayload.images = (patch as any).images;

    if ((patch as any).featured !== undefined) updatePayload.featured = (patch as any).featured;
    if ((patch as any).onSale !== undefined) updatePayload.on_sale = (patch as any).onSale;
    if ((patch as any).on_sale !== undefined) updatePayload.on_sale = (patch as any).on_sale;

    if ((patch as any).salePrice !== undefined) {
      updatePayload.sale_price =
        (patch as any).salePrice === "" || (patch as any).salePrice === null
          ? null
          : Number((patch as any).salePrice);
    }

    if ((patch as any).lengthCm !== undefined) {
      updatePayload.length_cm =
        (patch as any).lengthCm === "" || (patch as any).lengthCm === null
          ? null
          : Number((patch as any).lengthCm);
    }

    if ((patch as any).widthCm !== undefined) {
      updatePayload.width_cm =
        (patch as any).widthCm === "" || (patch as any).widthCm === null
          ? null
          : Number((patch as any).widthCm);
    }

    if ((patch as any).heightCm !== undefined) {
      updatePayload.height_cm =
        (patch as any).heightCm === "" || (patch as any).heightCm === null
          ? null
          : Number((patch as any).heightCm);
    }

    if ((patch as any).weightKg !== undefined) {
      updatePayload.weight_kg =
        (patch as any).weightKg === "" || (patch as any).weightKg === null
          ? null
          : Number((patch as any).weightKg);
    }

    if (patch.price !== undefined && typeof patch.price === "number") {
      updatePayload.price = patch.price;
      updatePayload.price_cents = Math.round(patch.price * 100);
    }

    const { error } = await supabase.from("products").update(updatePayload).eq("id", id);

    if (error) {
      console.error("❌ Supabase updateProduct error:", error);
      throw error;
    }

    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("❌ Supabase deleteProduct error:", error);
      throw error;
    }

    await fetchProducts();
  };

  const clearProducts = async () => {
    const { error } = await supabase.from("products").delete().neq("id", "___never___");

    if (error) {
      console.error("❌ Supabase clearProducts error:", error);
      throw error;
    }

    await fetchProducts();
  };

  const addCategory = async (c: Omit<Category, "id">) => {
    const payload = { name: c.name, icon: (c as any).icon ?? "•" };
    const { error } = await supabase.from("categories").insert([payload]);

    if (error) {
      console.warn("⚠️ addCategory Supabase failed, adding locally:", error.message);
      setCategories((prev) => [...prev, { ...c, id: uuidv4() } as Category]);
      return;
    }

    await fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.warn("⚠️ deleteCategory Supabase failed, deleting locally:", error.message);
      setCategories((prev) => prev.filter((x) => x.id !== id));
      return;
    }

    await fetchCategories();
  };

  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + (Number(i.product.price) || 0) * i.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  const placeOrder = (
    customer: Order["customer"],
    deliveryMethod: Order["deliveryMethod"]
  ): Order => {
    const order: Order = {
      id: `ORD-${Date.now()}`,
      items: [...cart],
      total: cartTotal,
      status: "pending",
      customer,
      createdAt: new Date().toISOString(),
      deliveryMethod,
    };
    setOrders((prev) => [order, ...prev]);
    clearCart();
    return order;
  };

  const updateOrderStatus = (id: string, status: Order["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        clearProducts,

        categories,
        addCategory,
        deleteCategory,

        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        cartTotal,
        cartCount,

        orders,
        placeOrder,
        updateOrderStatus,

        isAdmin,
        setIsAdmin,
        adminPassword,

        loadingProducts,
        loadingCategories,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}