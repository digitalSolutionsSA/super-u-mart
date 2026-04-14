import React, { useEffect, useMemo, useState } from 'react';
import { X, ShoppingCart, Ruler, Weight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

function normalizeImages(product: Product): string[] {
  const rawImages = (product as any).images;
  const fallback =
    (product as any).image ||
    (product as any).imageUrl ||
    (product as any).image_url ||
    '';

  const out: string[] = [];

  if (Array.isArray(rawImages)) {
    for (const item of rawImages) {
      if (typeof item === 'string' && item.trim()) {
        out.push(item.trim());
      } else if (item && typeof item === 'object') {
        if (typeof item.url === 'string' && item.url.trim()) out.push(item.url.trim());
        if (typeof item.src === 'string' && item.src.trim()) out.push(item.src.trim());
      }
    }
  } else if (typeof rawImages === 'string' && rawImages.trim()) {
    try {
      const parsed = JSON.parse(rawImages);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string' && item.trim()) out.push(item.trim());
          else if (item && typeof item === 'object') {
            if (typeof item.url === 'string' && item.url.trim()) out.push(item.url.trim());
            if (typeof item.src === 'string' && item.src.trim()) out.push(item.src.trim());
          }
        }
      } else {
        out.push(rawImages.trim());
      }
    } catch {
      out.push(rawImages.trim());
    }
  }

  if (fallback && !out.includes(fallback)) {
    out.unshift(fallback);
  }

  return Array.from(new Set(out)).filter(Boolean);
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { addToCart } = useStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const imageList = useMemo(() => normalizeImages(product), [product]);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    setSelectedImage(
      imageList[0] ||
        'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80'
    );
  }, [imageList, product]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // lock background scroll while modal is open
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  const bulkPrice = (product as any).bulkPrice;
  const bulkMinQty = (product as any).bulkMinQty;

  const activePrice =
    bulkPrice && bulkMinQty && qty >= bulkMinQty ? bulkPrice : Number(product.price || 0);

  const stockCount = Number(product.stock || 0);
  const hasStock = stockCount > 0;

  const lengthCm = (product as any).lengthCm;
  const widthCm = (product as any).widthCm;
  const heightCm = (product as any).heightCm;
  const weightKg = (product as any).weightKg;

  const hasDimensions =
    (lengthCm !== undefined && lengthCm !== null && lengthCm !== '') ||
    (widthCm !== undefined && widthCm !== null && widthCm !== '') ||
    (heightCm !== undefined && heightCm !== null && heightCm !== '') ||
    (weightKg !== undefined && weightKg !== null && weightKg !== '');

  const currentIndex = Math.max(0, imageList.findIndex((img) => img === selectedImage));

  const goPrevImage = () => {
    if (imageList.length <= 1) return;
    const nextIndex = currentIndex <= 0 ? imageList.length - 1 : currentIndex - 1;
    setSelectedImage(imageList[nextIndex]);
  };

  const goNextImage = () => {
    if (imageList.length <= 1) return;
    const nextIndex = currentIndex >= imageList.length - 1 ? 0 : currentIndex + 1;
    setSelectedImage(imageList[nextIndex]);
  };

  const handleAdd = () => {
    if (!hasStock) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const goToCart = () => {
  onClose();
  navigate('/cart');
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
          width: '100%',
          maxWidth: isMobile ? '100%' : 980,
          height: isMobile ? '92vh' : 670,
          maxHeight: '92vh',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'modalIn 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            padding: isMobile ? '16px 18px' : '20px 24px',
            borderRadius: '14px 14px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            flexShrink: 0,
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.02fr 1fr',
            gap: 0,
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: isMobile ? 18 : 22,
              borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
              borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: isMobile ? 280 : 350,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                overflow: 'hidden',
                padding: isMobile ? 14 : 18,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'white',
                  border: '1px solid #edf2f7',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: isMobile ? 10 : 14,
                }}
              >
                <img
                  src={selectedImage}
                  alt={product.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80';
                  }}
                />
              </div>

              {imageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrevImage}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(255,255,255,0.94)',
                      border: '1px solid #dbe2ea',
                      borderRadius: 999,
                      width: 38,
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={goNextImage}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(255,255,255,0.94)',
                      border: '1px solid #dbe2ea',
                      borderRadius: 999,
                      width: 38,
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)',
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {hasDimensions && (
              <div style={{ flexShrink: 0 }}>
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
                  {lengthCm !== undefined && lengthCm !== null && lengthCm !== '' && (
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
                        {lengthCm} cm
                      </div>
                    </div>
                  )}

                  {widthCm !== undefined && widthCm !== null && widthCm !== '' && (
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
                        {widthCm} cm
                      </div>
                    </div>
                  )}

                  {heightCm !== undefined && heightCm !== null && heightCm !== '' && (
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
                        {heightCm} cm
                      </div>
                    </div>
                  )}

                  {weightKg !== undefined && weightKg !== null && weightKg !== '' && (
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
                        {weightKg} kg
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: isMobile ? 18 : 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <div style={{ flexShrink: 0 }}>
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

            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <h4
                style={{
                  margin: '0 0 8px',
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#1e293b',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontFamily: 'Barlow, sans-serif',
                  flexShrink: 0,
                }}
              >
                Description
              </h4>

              <div
                style={{
                  flex: 1,
                  minHeight: 120,
                  maxHeight: isMobile ? 180 : 260,
                  overflowY: 'auto',
                  paddingRight: 6,
                }}
              >
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

                {(product as any).tags && (product as any).tags.length > 0 && (
                  <div style={{ marginTop: 16 }}>
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
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: isMobile ? 'stretch' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 10,
                flexShrink: 0,
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