import React, { useState } from 'react';
import { X, ShoppingCart, Package, Ruler, Weight } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { addToCart } = useStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const goToCart = () => {
    addToCart(product, qty);
    navigate('/cart');
    onClose();
  };

  const activePrice = product.bulkPrice && product.bulkMinQty && qty >= product.bulkMinQty
    ? product.bulkPrice
    : product.price;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 14,
          maxWidth: 820,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'modalIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '20px 24px', borderRadius: '14px 14px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontFamily: 'Barlow, sans-serif', fontWeight: 800, fontSize: 22 }}>{product.name}</h2>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>SKU: {product.sku} • Stock: {product.stock}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Image */}
          <div style={{ padding: 24, borderRight: '1px solid #e2e8f0' }}>
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 10 }}
              onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80'; }}
            />
          </div>

          {/* Details */}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Price */}
            <div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#1a2e7a', fontFamily: 'Barlow, sans-serif' }}>
                R{activePrice.toFixed(2)}
              </div>
              {product.bulkPrice && product.bulkMinQty && (
                <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 600, marginTop: 4 }}>
                  Bulk price: R{product.bulkPrice.toFixed(2)} (min {product.bulkMinQty} units)
                  {qty >= product.bulkMinQty && ' — Bulk rate applied!'}
                </div>
              )}
            </div>

            {/* Description */}
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#475569' }}>{product.description}</p>

            {/* Dimensions */}
            {(product.length || product.weight) && (
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Dimensions (for courier pricing)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {product.length && (
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Length</div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{product.length} cm</div>
                    </div>
                  )}
                  {product.width && (
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Width</div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{product.width} cm</div>
                    </div>
                  )}
                  {product.height && (
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Height</div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{product.height} cm</div>
                    </div>
                  )}
                  {product.weight && (
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Weight</div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{product.weight} kg</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Highlights */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Highlights</h4>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {product.tags.map((t, i) => (
                    <li key={i} style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Qty + Add */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: '8px 14px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>−</button>
                <span style={{ padding: '8px 16px', fontWeight: 700, fontFamily: 'Barlow, sans-serif', minWidth: 40, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ padding: '8px 14px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>+</button>
              </div>
              <button onClick={handleAdd} style={{
                flex: 1,
                background: added ? '#22c55e' : '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                cursor: 'pointer',
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.2s',
              }}>
                <ShoppingCart size={16} />
                {added ? 'Added to cart!' : 'Add to cart'}
              </button>
              <button onClick={goToCart} style={{
                background: '#1a2e7a',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                cursor: 'pointer',
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                whiteSpace: 'nowrap',
              }}>
                Go to Cart
              </button>
            </div>
          </div>
        </div>

        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
      </div>
    </div>
  );
}
