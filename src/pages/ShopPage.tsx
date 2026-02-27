import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

export default function ShopPage() {
  const { products, categories } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState('default');
  const [priceMax, setPriceMax] = useState(10000);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // ✅ Only these categories should appear in the sidebar
  const ALLOWED_CATEGORY_IDS = useMemo(
    () => new Set(['tools', 'cleaning', 'personal-care', 'electrical', 'stationary']),
    []
  );

  // ✅ Show only allowed categories (sidebar list)
  const allowedCategories = useMemo(() => {
    return categories.filter((c) => ALLOWED_CATEGORY_IDS.has(c.id));
  }, [categories, ALLOWED_CATEGORY_IDS]);

  // ✅ Read category from URL but ignore it if it's not allowed
  const rawCategoryFilter = searchParams.get('category') || '';
  const categoryFilter = useMemo(() => {
    if (!rawCategoryFilter) return '';
    return ALLOWED_CATEGORY_IDS.has(rawCategoryFilter) ? rawCategoryFilter : '';
  }, [rawCategoryFilter, ALLOWED_CATEGORY_IDS]);

  const setCategory = (cat: string) => {
    if (cat && !ALLOWED_CATEGORY_IDS.has(cat)) return;
    setSearchParams(cat ? { category: cat } : {});
  };

  const filtered = useMemo(() => {
    let list = [...products];

    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    list = list.filter((p) => p.price <= priceMax);

    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'stock') list.sort((a, b) => b.stock - a.stock);

    return list;
  }, [products, categoryFilter, searchQuery, priceMax, sortBy]);

  const activeCategoryName = useMemo(() => {
    if (!categoryFilter) return 'All Products';
    return allowedCategories.find((c) => c.id === categoryFilter)?.name ?? 'Products';
  }, [categoryFilter, allowedCategories]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Barlow, sans-serif' }}>
      <Header onSearch={(q) => setSearchQuery(q)} />

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 24px', width: '100%', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28, flex: 1 }}>
        {/* Sidebar Filters */}
        <aside>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', position: 'sticky', top: 120 }}>
            <div style={{ background: '#1a2e7a', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <SlidersHorizontal size={16} color="white" />
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Filters</span>
            </div>

            {/* Categories */}
            <div style={{ padding: 18, borderBottom: '1px solid #f1f5f9' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#94a3b8' }}>
                Category
              </h4>

              <button
                onClick={() => setCategory('')}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 4,
                  background: !categoryFilter ? '#f97316' : 'transparent',
                  color: !categoryFilter ? 'white' : '#475569',
                  fontWeight: !categoryFilter ? 700 : 400,
                  fontSize: 13,
                }}
              >
                All Products
              </button>

              {allowedCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: 4,
                    background: categoryFilter === cat.id ? '#fff7ed' : 'transparent',
                    color: categoryFilter === cat.id ? '#f97316' : '#475569',
                    fontWeight: categoryFilter === cat.id ? 700 : 400,
                    fontSize: 13,
                  }}
                >
                  <span>{cat.icon}</span> {cat.name}
                </button>
              ))}
            </div>

            {/* Price range */}
            <div style={{ padding: 18 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#94a3b8' }}>
                Max Price
              </h4>
              <input
                type="range"
                min={0}
                max={5000}
                step={50}
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f97316' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginTop: 4 }}>
                <span>R0</span>
                <span style={{ fontWeight: 700, color: '#f97316' }}>R{priceMax.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 28, color: '#1e293b' }}>
                {activeCategoryName}
              </h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{filtered.length} products found</p>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'Barlow, sans-serif', color: '#475569', cursor: 'pointer' }}
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
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, fontFamily: 'Barlow, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={(e) => (((e.target as HTMLInputElement).style.borderColor = '#f97316'))}
              onBlur={(e) => (((e.target as HTMLInputElement).style.borderColor = '#e2e8f0'))}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontFamily: 'Barlow, sans-serif', color: '#475569' }}>No products found</h3>
              <p>Try changing your filters or search query.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} onView={setSelectedProduct} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}