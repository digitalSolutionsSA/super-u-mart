import React, { useEffect, useState } from 'react';
import { X, ShoppingCart, Ruler, Weight } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const productImage =
    (product as any).image ||
    (product as any).imageUrl ||
    (product as any).image_url ||
    (Array.isArray((product as any).images) && (product as any).images.length > 0
      ? (product as any).images[0]
      : '');

  const bulkPrice = (product as any).bulkPrice;
  const bulkMinQty = (product as any).bulkMinQty;

  const activePrice =
    bulkPrice && bulkMinQty && qty >= bulkMinQty ? bulkPrice : Number(product.price || 0);

  const stockCount = Number(product.stock || 0);
  const hasStock = stockCount > 0;

  const hasDimensions =
    (product as any).length ||
    (product as any).width ||
    (product as any).height ||
    (product as any).weight;

  const handleAdd = () => {
    if (!hasStock) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const goToCart = () => {
    if (!hasStock) return;
    addToCart(product, qty);
    navigate('/cart');
    onClose();
  };

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
        padding: isMobile ? 12 : 20,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 14,
          maxWidth: 960,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'modalIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            padding: isMobile ? '16px 18px' : '20px 24px',
            borderRadius: '14px 14px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                color: 'white',
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 800,
                fontSize: isMobile ? 20 : 22,
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              {product.name}
            </h2>

            <p
              style={{
                margin: '6px 0 0',
                color: 'rgba(255,255,255,0.9)',
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              SKU: {product.sku || '-'} • Stock: {product.stock ?? 0}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              borderRadius: 8,
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
              flexShrink: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.02fr 1fr',
            gap: 0,
          }}
        >
          {/* Left Side: Image + Dimensions */}
          <div
            style={{
              padding: isMobile ? 18 : 24,
              borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
              borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                width: '100%',
                minHeight: isMobile ? 260 : 360,
                maxHeight: isMobile ? 320 : 430,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: 16,
              }}
            >
              <img
                src={
                  productImage ||
                  'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80'
                }
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80';
                }}
              />
            </div>

            {hasDimensions && (
              <div>
                <h4
                  style={{
                    margin: '0 0 10px',
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#1e293b',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontFamily: 'Barlow, sans-serif',
                  }}
                >
                  Dimensions
                </h4>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  {(product as any).length && (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                          color: '#64748b',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Ruler size={14} />
                        Length
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: '#1e293b',
                          fontFamily: 'Barlow, sans-serif',
                          fontSize: 15,
                        }}
                      >
                        {(product as any).length} cm
                      </div>
                    </div>
                  )}

                  {(product as any).width && (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                          color: '#64748b',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Ruler size={14} />
                        Width
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: '#1e293b',
                          fontFamily: 'Barlow, sans-serif',
                          fontSize: 15,
                        }}
                      >
                        {(product as any).width} cm
                      </div>
                    </div>
                  )}

                  {(product as any).height && (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                          color: '#64748b',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Ruler size={14} />
                        Height
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: '#1e293b',
                          fontFamily: 'Barlow, sans-serif',
                          fontSize: 15,
                        }}
                      >
                        {(product as any).height} cm
                      </div>
                    </div>
                  )}

                  {(product as any).weight && (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                          color: '#64748b',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Weight size={14} />
                        Weight
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: '#1e293b',
                          fontFamily: 'Barlow, sans-serif',
                          fontSize: 15,
                        }}
                      >
                        {(product as any).weight} kg
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Details */}
          <div
            style={{
              padding: isMobile ? 18 : 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Price */}
            <div>
              <div
                style={{
                  fontSize: isMobile ? 28 : 34,
                  fontWeight: 900,
                  color: '#1a2e7a',
                  fontFamily: 'Barlow, sans-serif',
                  lineHeight: 1.1,
                }}
              >
                R{Number(activePrice || 0).toFixed(2)}
              </div>

              {bulkPrice && bulkMinQty && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#22c55e',
                    fontWeight: 700,
                    marginTop: 6,
                  }}
                >
                  Bulk price: R{Number(bulkPrice).toFixed(2)} (min {bulkMinQty} units)
                  {qty >= bulkMinQty ? ' • Bulk rate applied' : ''}
                </div>
              )}

              {!hasStock && (
                <div
                  style={{
                    marginTop: 8,
                    display: 'inline-block',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: 999,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Out of stock
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h4
                style={{
                  margin: '0 0 8px',
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#1e293b',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontFamily: 'Barlow, sans-serif',
                }}
              >
                Description
              </h4>

              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.75,
                  color: '#475569',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {product.description || 'No description available.'}
              </p>
            </div>

            {/* Highlights */}
            {(product as any).tags && (product as any).tags.length > 0 && (
              <div>
                <h4
                  style={{
                    margin: '0 0 8px',
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#1e293b',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontFamily: 'Barlow, sans-serif',
                  }}
                >
                  Highlights
                </h4>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {(product as any).tags.map((t: string, i: number) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 13,
                        color: '#475569',
                        marginBottom: 6,
                        lineHeight: 1.5,
                      }}
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Qty + Add */}
            <div
              style={{
                display: 'flex',
                alignItems: isMobile ? 'stretch' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 10,
                marginTop: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '2px solid #e2e8f0',
                  borderRadius: 8,
                  overflow: 'hidden',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={!hasStock}
                  style={{
                    padding: '10px 16px',
                    background: '#f8fafc',
                    border: 'none',
                    cursor: hasStock ? 'pointer' : 'not-allowed',
                    fontSize: 16,
                    fontWeight: 700,
                    opacity: hasStock ? 1 : 0.5,
                  }}
                >
                  −
                </button>

                <span
                  style={{
                    padding: '10px 16px',
                    fontWeight: 700,
                    fontFamily: 'Barlow, sans-serif',
                    minWidth: 48,
                    textAlign: 'center',
                    flex: 1,
                  }}
                >
                  {qty}
                </span>

                <button
                  onClick={() =>
                    setQty((q) => {
                      if (!hasStock) return 1;
                      return Math.min(stockCount, q + 1);
                    })
                  }
                  disabled={!hasStock}
                  style={{
                    padding: '10px 16px',
                    background: '#f8fafc',
                    border: 'none',
                    cursor: hasStock ? 'pointer' : 'not-allowed',
                    fontSize: 16,
                    fontWeight: 700,
                    opacity: hasStock ? 1 : 0.5,
                  }}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={!hasStock}
                style={{
                  flex: 1,
                  background: !hasStock ? '#94a3b8' : added ? '#22c55e' : '#f97316',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 16px',
                  cursor: hasStock ? 'pointer' : 'not-allowed',
                  fontFamily: 'Barlow, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background 0.2s',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                <ShoppingCart size={16} />
                {!hasStock ? 'Out of stock' : added ? 'Added to cart!' : 'Add to cart'}
              </button>

              <button
                onClick={goToCart}
                disabled={!hasStock}
                style={{
                  background: !hasStock ? '#94a3b8' : '#1a2e7a',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 16px',
                  cursor: hasStock ? 'pointer' : 'not-allowed',
                  fontFamily: 'Barlow, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                Go to Cart
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}