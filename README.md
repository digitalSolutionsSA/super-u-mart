# Super Ü Mart — Wholesale E-commerce Platform

A full-stack-ready wholesale ordering platform built with **Vite + React + TypeScript**.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## 📦 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── ProductModal.tsx
│   ├── AdminLayout.tsx
│   └── ProtectedRoute.tsx
├── pages/            # Route pages
│   ├── HomePage.tsx
│   ├── ShopPage.tsx
│   ├── CartPage.tsx
│   ├── CategoriesPage.tsx
│   ├── OrderSuccessPage.tsx
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   ├── AdminProducts.tsx
│   ├── AdminProductForm.tsx  ← Add/Edit products
│   ├── AdminOrders.tsx
│   └── AdminCategories.tsx
├── context/
│   └── StoreContext.tsx       ← All global state
├── data/
│   └── seedData.ts            ← Demo products & orders
└── types/
    └── index.ts               ← TypeScript interfaces
```

---

## 🛒 Customer Storefront

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, featured items, categories |
| `/shop` | Full catalogue with filters & search |
| `/shop?category=tools` | Filtered by category |
| `/categories` | All categories overview |
| `/cart` | Shopping cart + checkout |
| `/order-success/:id` | Order confirmation |

---

## 🔐 Admin Portal

| Route | Description |
|-------|-------------|
| `/admin` | Login page |
| `/admin/dashboard` | Overview, stats, recent orders |
| `/admin/products` | List, search, delete products |
| `/admin/add-product` | Add new product with image upload |
| `/admin/edit-product/:id` | Edit existing product |
| `/admin/orders` | Manage & update order statuses |
| `/admin/categories` | Add & manage product categories |

**Default admin password:** `SuperUAdmin2024`
(Change this in `StoreContext.tsx` → `adminPassword`)

---

## 📷 Adding Products

1. Go to `/admin` and log in
2. Navigate to **Add Product**
3. Fill in:
   - Product name, SKU, category
   - Price, bulk pricing, stock count
   - Upload photo (take with phone camera or drag & drop)
   - Dimensions for courier pricing
4. Click **Add Product**

---

## 🗄️ Data Storage

All data is stored in **localStorage** for now. To connect to a real backend:
- Replace `StoreContext.tsx` API calls with `fetch()` to your REST API
- Products, orders, and categories all have TypeScript interfaces ready in `src/types/index.ts`

---

## 🎨 Branding

- **Primary navy:** `#1a2e7a`
- **Orange accent:** `#f97316`
- **Font:** Barlow / Barlow Condensed (loaded from Google Fonts)

To change branding, update the color values and font in:
- `index.html` (font import)
- `src/index.css`
- Inline styles throughout components

---

## 🔧 Customisation Tips

- **Change password:** `src/context/StoreContext.tsx` → `adminPassword`
- **Add seed products:** `src/data/seedData.ts`
- **Add categories:** Admin portal → Categories
- **Styling:** All styles are inline React styles for easy editing
