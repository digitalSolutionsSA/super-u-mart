import React, { useState } from 'react';
import { ShoppingCart, Eye, Package } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onView?: (product: Product) => void;
}

export default function ProductCard({ product, onView }: ProductCardProps) {
  const { addToCart } = useStore();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const productImage =
    (product as any).image ||
    (product as any).imageUrl ||
    (product as any).image_url ||
    (Array.isArray((product as any).images) && (product as any).images.length > 0
      ? (product as any).images[0]
      : '');

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div
      onClick={() => onView?.(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: hovered ? '0 8px 32px rgba(26,46,122,0.18)' : '0 2px 8px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: '#f8fafc' }}>
        <img
          src={productImage || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80'}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80';
          }}
        />
        {(product as any).dealLabel && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: '#f97316',
              color: 'white',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
              fontFamily: 'Barlow, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {(product as any).dealLabel}
          </span>
        )}
        {hovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(product);
            }}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(26,46,122,0.9)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Eye size={14} /> Details
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: 16 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: '#94a3b8',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontFamily: 'Barlow, sans-serif',
          }}
        >
          SKU: {product.sku}
        </p>

        <h3
          style={{
            margin: '4px 0 8px',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'Barlow, sans-serif',
            color: '#1e293b',
            lineHeight: 1.3,
          }}
        >
          {product.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Package size={13} color="#94a3b8" />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Stock: {product.stock}</span>
          {(product as any).bulkPrice && (
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, marginLeft: 'auto' }}>
              Bulk from R{(product as any).bulkPrice.toFixed(2)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#1a2e7a',
              fontFamily: 'Barlow, sans-serif',
            }}
          >
            R{Number(product.price || 0).toFixed(2)}
          </span>

          <button
            onClick={handleAdd}
            style={{
              background: added ? '#22c55e' : '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: 'Barlow, sans-serif',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.2s',
            }}
          >
            <ShoppingCart size={14} />
            {added ? 'Added!' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}