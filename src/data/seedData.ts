import { Product, Category, Order } from "../types";

export const defaultCategories: Category[] = [
  {
    id: "groceries",
    name: "Groceries",
    icon: "🛒",
    description: "Everyday food & beverage essentials",
  },
  {
    id: "cleaning",
    name: "Cleaning & Hygiene",
    icon: "🧹",
    description: "Cleaning products and hygiene supplies",
  },
  {
    id: "tools",
    name: "Tools & Hardware",
    icon: "🔧",
    description: "Power tools, hand tools, and hardware",
  },
  {
    id: "electrical",
    name: "Electrical",
    icon: "💡",
    description: "Bulbs, cables, switches and more",
  },
  {
    id: "packaging",
    name: "Packaging",
    icon: "📦",
    description: "Bags, boxes, tape and packaging supplies",
  },
  {
    id: "beverages",
    name: "Beverages",
    icon: "🥤",
    description: "Cold drinks, juices and water",
  },
  {
    id: "personal-care",
    name: "Personal Care",
    icon: "🧴",
    description: "Soap, shampoo, toiletries",
  },
  {
    id: "stationary",
    name: "Computer & Peripherals",
    icon: "✏️",
    description: "Pens, paper, office essentials",
  },
];

/**
 * ✅ Intentionally empty.
 * You want NO demo products shown anywhere on the site.
 * Products should only appear once they are uploaded and saved in Supabase.
 */
export const sampleProducts: Product[] = [];

/**
 * ✅ Intentionally empty.
 * Orders will be populated later from Supabase (or another backend flow).
 */
export const sampleOrders: Order[] = [];