import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductModal from '../components/ProductModal';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

const MARQUEE_CATEGORIES = [
  { id: 'kitchen-appliances', name: 'Kitchen Appliances', image: '/categories/kitchen-appliances.png' },
  { id: 'electronics-gaming', name: 'Electronics & Gaming', image: '/categories/electronics-gaming.png' },
  { id: 'tools-hardware', name: 'Tools & Hardware', image: '/categories/tools-hardware.png' },
  { id: 'toys', name: 'Toys', image: '/categories/toys.png' },
  { id: 'sports-outdoor', name: 'Sports & Outdoor', image: '/categories/sports-outdoor.png' },
  { id: 'car-accessories', name: 'Car Accessories', image: '/categories/car-accessories.png' },
  { id: 'lights-solar', name: 'Lights & Solar', image: '/categories/lights-solar.png' },
];

/** Try to detect if something is "on sale" without knowing your exact schema */
function isOnSale(p: any): boolean {
  if (!p) return false;

  if (p.onSale === true || p.isOnSale === true || p.sale === true) return true;

  const salePrice =
    typeof p.salePrice === 'number'
      ? p.salePrice
      : typeof p.sale_price === 'number'
      ? p.sale_price
      : typeof p.discountPrice === 'number'
      ? p.discountPrice
      : typeof p.discount_price === 'number'
      ? p.discount_price
      : null;

  const compareAt =
    typeof p.compareAtPrice === 'number'
      ? p.compareAtPrice
      : typeof p.compare_at_price === 'number'
      ? p.compare_at_price
      : typeof p.originalPrice === 'number'
      ? p.originalPrice
      : typeof p.original_price === 'number'
      ? p.original_price
      : null;

  if (typeof salePrice === 'number' && typeof compareAt === 'number') {
    return salePrice < compareAt;
  }

  if (typeof salePrice === 'number') return true;

  if (typeof p.discountPercent === 'number' && p.discountPercent > 0) return true;
  if (typeof p.discount_percent === 'number' && p.discount_percent > 0) return true;

  return false;
}

/** Get an image URL from whatever you happen to store */
function getProductImage(p: any): string | null {
  if (!p) return null;

  const direct =
    p.image ||
    p.imageUrl ||
    p.image_url ||
    p.thumbnail ||
    p.thumbnailUrl ||
    p.thumbnail_url ||
    null;

  if (direct) return String(direct);

  if (Array.isArray(p.images) && p.images.length > 0) return String(p.images[0]);
  if (Array.isArray(p.imageUrls) && p.imageUrls.length > 0) return String(p.imageUrls[0]);

  return null;
}

/** Pull sale + original prices in a best-effort way */
function getPrices(p: any): { price: number; original?: number } {
  const basePrice = typeof p.price === 'number' ? p.price : 0;

  const salePrice =
    typeof p.salePrice === 'number'
      ? p.salePrice
      : typeof p.sale_price === 'number'
      ? p.sale_price
      : typeof p.discountPrice === 'number'
      ? p.discountPrice
      : typeof p.discount_price === 'number'
      ? p.discount_price
      : null;

  const compareAt =
    typeof p.compareAtPrice === 'number'
      ? p.compareAtPrice
      : typeof p.compare_at_price === 'number'
      ? p.compare_at_price
      : typeof p.originalPrice === 'number'
      ? p.originalPrice
      : typeof p.original_price === 'number'
      ? p.original_price
      : null;

  if (typeof salePrice === 'number' && typeof compareAt === 'number') {
    return { price: salePrice, original: compareAt };
  }

  if (typeof salePrice === 'number') {
    const original = basePrice > salePrice ? basePrice : undefined;
    return { price: salePrice, original };
  }

  return { price: basePrice };
}

export default function HomePage() {
  const { products } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const saleItems = useMemo(() => {
    const sale = products.filter((p: any) => isOnSale(p));
    return sale.length > 0 ? sale : products.filter((p: any) => p.featured);
  }, [products]);

  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Keep index safe when product list changes
  useEffect(() => {
    if (slideIndex >= saleItems.length) setSlideIndex(0);
  }, [saleItems.length, slideIndex]);

  // Auto-advance sale list
  useEffect(() => {
    if (paused) return;
    if (saleItems.length <= 1) return;

    const t = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % saleItems.length);
    }, 4000);

    return () => window.clearInterval(t);
  }, [paused, saleItems.length]);

  const goPrev = () => {
    if (saleItems.length === 0) return;
    setSlideIndex((i) => (i - 1 + saleItems.length) % saleItems.length);
  };

  const goNext = () => {
    if (saleItems.length === 0) return;
    setSlideIndex((i) => (i + 1) % saleItems.length);
  };

  // -----------------------------
  // Marquee: REAL seamless loop (JS + modulo)
  // -----------------------------
  const marqueeOuterRef = useRef<HTMLDivElement | null>(null);
  const marqueeTrackRef = useRef<HTMLDivElement | null>(null);
  const [marqueePaused, setMarqueePaused] = useState(false);

  const marqueeShiftPxRef = useRef(0);
  const marqueeXRef = useRef(0);
  const lastTRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const measureMarquee = () => {
    const track = marqueeTrackRef.current;
    if (!track) return;

    const firstGroup = track.querySelector('.catMarqueeGroup') as HTMLElement | null;
    if (!firstGroup) return;

    // distance to loop = full width of first group
    marqueeShiftPxRef.current = firstGroup.scrollWidth;
    // keep x within bounds to avoid huge numbers over time
    if (marqueeShiftPxRef.current > 0) {
      marqueeXRef.current = marqueeXRef.current % marqueeShiftPxRef.current;
    }
  };

  useEffect(() => {
    // Measure initially + after layout settles
    measureMarquee();
    const r1 = requestAnimationFrame(() => {
      measureMarquee();
      requestAnimationFrame(measureMarquee);
    });

    const onResize = () => measureMarquee();
    window.addEventListener('resize', onResize);

    // Observe group size changes (image load, font, etc.)
    let ro: ResizeObserver | null = null;
    const track = marqueeTrackRef.current;
    const firstGroup = track?.querySelector('.catMarqueeGroup') as HTMLElement | null;
    if (firstGroup && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => measureMarquee());
      ro.observe(firstGroup);
    }

    return () => {
      cancelAnimationFrame(r1);
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const speedPxPerSec = 70; // adjust to taste

    const tick = (t: number) => {
      const track = marqueeTrackRef.current;
      const loop = marqueeShiftPxRef.current;

      if (!track || loop <= 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastTRef.current == null) lastTRef.current = t;
      const dt = (t - lastTRef.current) / 1000;
      lastTRef.current = t;

      if (!marqueePaused) {
        marqueeXRef.current += speedPxPerSec * dt;
        // modulo wrap
        if (marqueeXRef.current >= loop) marqueeXRef.current = marqueeXRef.current % loop;
        track.style.transform = `translateX(${-marqueeXRef.current}px)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTRef.current = null;
    };
  }, [marqueePaused]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Barlow, sans-serif' }}>
      <Header />

      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1a2e7a 0%, #111d5e 60%, #1a2e7a 100%)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 480,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1553413077-190dd305871c?w=1400&q=60)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
          }}
        />

        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '60px 24px',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 48,
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.4)',
                borderRadius: 20,
                padding: '6px 14px',
                marginBottom: 20,
              }}
            >
              <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%' }} />
              <span style={{ color: '#86efac', fontSize: 13, fontWeight: 600 }}>Wholesale stock available now</span>
            </div>

            <h1 style={{ color: 'white', fontFamily: 'Barlow Condensed, Barlow, sans-serif', fontWeight: 900, fontSize: 52, lineHeight: 1.05, margin: '0 0 20px' }}>
              Simple wholesale ordering for everyday essentials.
            </h1>

            <p style={{ color: '#cbd5e1', fontSize: 16, lineHeight: 1.7, margin: '0 0 32px' }}>
              Browse categories, add to cart, choose courier, pay securely.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link
                to="/shop"
                style={{
                  background: '#f97316',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '14px 32px',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontFamily: 'Barlow Condensed, sans-serif',
                  boxShadow: '0 14px 28px rgba(249,115,22,0.25)',
                }}
              >
                Start shopping
              </Link>

              <Link
                to="/register"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '14px 32px',
                  borderRadius: 10,
                  border: '2px solid rgba(255,255,255,0.25)',
                  textDecoration: 'none',
                }}
              >
                Create wholesale account
              </Link>
            </div>
          </div>

          {/* Featured deals (mini list: 2–3 products) */}
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            style={{
              borderRadius: 18,
              padding: 18,
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(226,232,240,0.9)',
              boxShadow: '0 26px 70px rgba(0,0,0,0.42)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', letterSpacing: -0.2 }}>On sale</h3>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>
                  {saleItems.length > 0 ? `${slideIndex + 1} / ${saleItems.length}` : '0 / 0'}
                </span>
              </div>

              {saleItems.length > 1 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={goPrev}
                    aria-label="Previous"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: 'white',
                      cursor: 'pointer',
                      fontWeight: 900,
                      color: '#0f172a',
                      boxShadow: '0 10px 18px rgba(15,23,42,0.10)',
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={goNext}
                    aria-label="Next"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: 'white',
                      cursor: 'pointer',
                      fontWeight: 900,
                      color: '#0f172a',
                      boxShadow: '0 10px 18px rgba(15,23,42,0.10)',
                    }}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {saleItems.length > 0 ? (
              <>
                {(() => {
                  const visibleCount = 3;
                  const slice: any[] = [];
                  for (let k = 0; k < Math.min(visibleCount, saleItems.length); k++) {
                    slice.push(saleItems[(slideIndex + k) % saleItems.length]);
                  }

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                      {slice.map((p, idx) => {
                        const img = getProductImage(p);
                        const { price, original } = getPrices(p);
                        const hasSave = typeof original === 'number' && original > price;
                        const savePct = hasSave ? Math.round(((original! - price) / original!) * 100) : 0;

                        return (
                          <div
                            key={`${p.id ?? p.name}-${idx}`}
                            onClick={() => setSelectedProduct(p)}
                            role="button"
                            title="View product"
                            style={{
                              display: 'flex',
                              gap: 12,
                              alignItems: 'center',
                              padding: 12,
                              borderRadius: 14,
                              border: '1px solid #e2e8f0',
                              background: 'white',
                              cursor: 'pointer',
                              boxShadow: '0 10px 18px rgba(15,23,42,0.06)',
                            }}
                          >
                            <div
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                overflow: 'hidden',
                                background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
                                flex: '0 0 auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {img ? (
                                <img
                                  src={img}
                                  alt={p.name}
                                  loading="lazy"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                              ) : (
                                <span style={{ fontSize: 11, fontWeight: 900, color: '#64748b' }}>No img</span>
                              )}
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: 900,
                                  fontSize: 13,
                                  color: '#0f172a',
                                  lineHeight: 1.2,
                                  marginBottom: 6,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {p.name}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>R{price.toFixed(2)}</div>

                                {typeof original === 'number' && (
                                  <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textDecoration: 'line-through' }}>
                                    R{original.toFixed(2)}
                                  </div>
                                )}

                                {hasSave && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 900,
                                      color: '#166534',
                                      background: 'rgba(34,197,94,0.14)',
                                      border: '1px solid rgba(34,197,94,0.30)',
                                      padding: '3px 8px',
                                      borderRadius: 999,
                                    }}
                                  >
                                    SAVE {savePct}%
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(p);
                              }}
                              style={{
                                background: '#f97316',
                                color: 'white',
                                border: 'none',
                                borderRadius: 10,
                                padding: '10px 12px',
                                fontWeight: 900,
                                fontSize: 12,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 14px 28px rgba(249,115,22,0.22)',
                              }}
                            >
                              Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {saleItems.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                    {saleItems.slice(0, 10).map((_, i) => (
                      <button
                        key={i}
                        aria-label={`Go to slide ${i + 1}`}
                        onClick={() => setSlideIndex(i)}
                        style={{
                          width: i === slideIndex ? 18 : 8,
                          height: 8,
                          borderRadius: 999,
                          border: 'none',
                          cursor: 'pointer',
                          background: i === slideIndex ? '#1a2e7a' : '#cbd5e1',
                          transition: 'all 160ms ease',
                        }}
                      />
                    ))}
                    {saleItems.length > 10 && (
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 900, marginLeft: 6 }}>
                        +{saleItems.length - 10}
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: 18, borderRadius: 12, border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 700 }}>
                No sale/featured items found. Your store is either empty or your product data is playing hide-and-seek.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories Marquee (seamless JS loop) */}
      <section style={{ width: '100%', margin: '40px 0 0', padding: 0 }}>
        <div
          ref={marqueeOuterRef}
          onMouseEnter={() => setMarqueePaused(true)}
          onMouseLeave={() => setMarqueePaused(false)}
          style={{
            width: '100%',
            background: 'white',
            borderTop: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            overflow: 'hidden',
            padding: '16px 24px',
          }}
        >
          <div
            ref={marqueeTrackRef}
            style={{
              display: 'flex',
              width: 'max-content',
              willChange: 'transform',
              transform: 'translateX(0px)',
            }}
          >
            {/* Group 1 */}
            <div className="catMarqueeGroup" style={{ display: 'flex', gap: 18, paddingRight: 18 }}>
              {MARQUEE_CATEGORIES.map((cat) => (
                <Link key={`g1-${cat.id}`} to={`/shop?category=${cat.id}`} style={{ flex: '0 0 auto', textDecoration: 'none', color: 'inherit' }}>
                  <div
                    style={{
                      width: 220,
                      borderRadius: 16,
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      background: '#ffffff',
                      boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        backgroundImage: `url(${cat.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div style={{ padding: '14px 14px 16px' }}>
                      <div style={{ fontWeight: 900, fontSize: 14 }}>{cat.name}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Group 2 (duplicate) */}
            <div className="catMarqueeGroup" style={{ display: 'flex', gap: 18, paddingRight: 18 }}>
              {MARQUEE_CATEGORIES.map((cat) => (
                <Link key={`g2-${cat.id}`} to={`/shop?category=${cat.id}`} style={{ flex: '0 0 auto', textDecoration: 'none', color: 'inherit' }}>
                  <div
                    style={{
                      width: 220,
                      borderRadius: 16,
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      background: '#ffffff',
                      boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        backgroundImage: `url(${cat.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div style={{ padding: '14px 14px 16px' }}>
                      <div style={{ fontWeight: 900, fontSize: 14 }}>{cat.name}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}