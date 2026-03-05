export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  bulkPrice?: number;
  bulkMinQty?: number;
  stock: number;
  category: string;
  imageUrl: string;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  tags?: string[];
  featured?: boolean;
  dealLabel?: string;
  createdAt: string;
}


export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  createdAt: string;
  deliveryMethod: 'courier' | 'collection';
}

export type AdminPage = 'dashboard' | 'products' | 'orders' | 'categories' | 'add-product' | 'edit-product';
