import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category, CartItem, Order } from '../types';
import { sampleProducts, defaultCategories, sampleOrders } from '../data/seedData';
import { v4 as uuidv4 } from 'uuid';

interface StoreContextType {
  // Products
  products: Product[];
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Categories
  categories: Category[];
  addCategory: (c: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;

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
  placeOrder: (customer: Order['customer'], deliveryMethod: Order['deliveryMethod']) => Order;
  updateOrderStatus: (id: string, status: Order['status']) => void;

  // Auth (simple)
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  adminPassword: string;
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => loadLS('sum_products', sampleProducts));
  const [categories, setCategories] = useState<Category[]>(() => loadLS('sum_categories', defaultCategories));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => loadLS('sum_orders', sampleOrders));
  const [isAdmin, setIsAdmin] = useState(false);

  const adminPassword = 'SuperUAdmin2024';

  useEffect(() => { localStorage.setItem('sum_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('sum_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('sum_orders', JSON.stringify(orders)); }, [orders]);

  const addProduct = (p: Omit<Product, 'id' | 'createdAt'>) => {
    setProducts(prev => [...prev, { ...p, id: uuidv4(), createdAt: new Date().toISOString() }]);
  };

  const updateProduct = (id: string, p: Partial<Product>) => {
    setProducts(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(x => x.id !== id));
  };

  const addCategory = (c: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...c, id: uuidv4() }]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(x => x.id !== id));
  };

  const addToCart = (product: Product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const placeOrder = (customer: Order['customer'], deliveryMethod: Order['deliveryMethod']): Order => {
    const order: Order = {
      id: `ORD-${Date.now()}`,
      items: [...cart],
      total: cartTotal,
      status: 'pending',
      customer,
      createdAt: new Date().toISOString(),
      deliveryMethod,
    };
    setOrders(prev => [order, ...prev]);
    clearCart();
    return order;
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <StoreContext.Provider value={{
      products, addProduct, updateProduct, deleteProduct,
      categories, addCategory, deleteCategory,
      cart, addToCart, removeFromCart, updateCartQty, clearCart, cartTotal, cartCount,
      orders, placeOrder, updateOrderStatus,
      isAdmin, setIsAdmin, adminPassword,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
