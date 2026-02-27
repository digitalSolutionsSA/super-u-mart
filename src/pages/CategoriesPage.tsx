import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

export default function CategoriesPage() {
  const { categories, products } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Barlow, sans-serif' }}>
      <Header />
      <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 24px', width: '100%' }}>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 40, color: '#1e293b', marginBottom: 8 }}>All Categories</h1>
        <p style={{ color: '#64748b', marginBottom: 40 }}>Browse our full wholesale range by category</p>

        {categories.map(cat => {
          const catProducts = products.filter(p => p.category === cat.id);
          if (catProducts.length === 0) return null;
          return (
            <div key={cat.id} style={{ marginBottom: 56 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 28, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span>{cat.icon}</span> {cat.name}
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>({catProducts.length})</span>
                </h2>
                <Link to={`/shop?category=${cat.id}`} style={{ color: '#f97316', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>View all →</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                {catProducts.slice(0, 4).map(product => (
                  <ProductCard key={product.id} product={product} onView={setSelectedProduct} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Footer />
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}
