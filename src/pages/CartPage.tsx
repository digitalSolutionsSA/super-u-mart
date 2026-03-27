import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowRight, Truck, Store, ClipboardList } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useStore } from '../context/StoreContext';

function getProductImage(product: any) {
  const candidates = [
    product?.imageUrl,
    product?.image_url,
    product?.image,
    Array.isArray(product?.images) ? product.images[0] : undefined,
  ];

  return (
    candidates.find(
      (value) => typeof value === 'string' && value.trim().length > 0
    ) ||
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80'
  );
}

function toSafeNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '').trim();
}

type DeliveryMethod = 'courier' | 'collection';

type CheckoutForm = {
  name: string;
  email: string;
  phone: string;
  streetAddress: string;
  addressLine2: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  note: string;
};

const initialForm: CheckoutForm = {
  name: '',
  email: '',
  phone: '',
  streetAddress: '',
  addressLine2: '',
  suburb: '',
  city: '',
  province: '',
  postalCode: '',
  note: '',
};

const pageShell: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
  fontFamily: 'Barlow, sans-serif',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.98)',
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 22px',
  fontWeight: 800,
  fontSize: 22,
  color: '#0f172a',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 8,
};

const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1.5px solid #dbe3ee',
  background: '#f8fafc',
  fontSize: 14,
  fontFamily: 'Barlow, sans-serif',
  color: '#0f172a',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'all 0.2s ease',
};

function setFocusedStyle(el: HTMLInputElement | HTMLTextAreaElement) {
  el.style.borderColor = '#f97316';
  el.style.background = '#ffffff';
  el.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.10)';
}

function setBlurredStyle(el: HTMLInputElement | HTMLTextAreaElement) {
  el.style.borderColor = '#dbe3ee';
  el.style.background = '#f8fafc';
  el.style.boxShadow = 'none';
}

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateCartQty,
    cartTotal,
    cartWeight,
    getDeliveryFee,
    getOrderTotal,
  } = useStore();

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('courier');
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [placing, setPlacing] = useState(false);

  const deliveryFee = getDeliveryFee(deliveryMethod);
  const orderTotal = getOrderTotal(deliveryMethod);

  const handleFieldChange = (key: keyof CheckoutForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (placing) return;

    if (!cart.length) {
      alert('Your cart is empty.');
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      alert('Please complete your name, email address, and phone number.');
      return;
    }

    if (deliveryMethod === 'courier') {
      if (
        !form.streetAddress.trim() ||
        !form.suburb.trim() ||
        !form.city.trim() ||
        !form.province.trim() ||
        !form.postalCode.trim()
      ) {
        alert('Please complete your full delivery address.');
        return;
      }
    }

    const normalizedItems = cart
      .map(({ product, quantity }) => {
        const price = toSafeNumber(product?.price);
        const qty = toSafeNumber(quantity);
        const weightKg = toSafeNumber((product as any)?.weightKg);

        return {
          id: String(product?.id ?? '').trim(),
          product_id: String(product?.id ?? '').trim(),
          name: String(product?.name ?? '').trim(),
          sku: String(product?.sku ?? '').trim(),
          price,
          price_cents: Math.round(price * 100),
          qty,
          quantity: qty,
          weightKg,
          image: getProductImage(product),
        };
      })
      .filter(item => item.id && item.name && item.price > 0 && item.qty > 0);

    if (!normalizedItems.length) {
      alert('Your cart items are invalid. Please remove and re-add the products.');
      return;
    }

    const safeSubtotal = Number(cartTotal.toFixed(2));
    const safeDeliveryFee = Number(deliveryFee.toFixed(2));
    const safeTotalWeight = Number(cartWeight.toFixed(2));
    const safeTotal = Number(orderTotal.toFixed(2));

    if (safeTotal <= 0) {
      alert('Your order total is invalid.');
      return;
    }

    const cleanedPhone = normalizePhone(form.phone);

    const deliveryAddress =
      deliveryMethod === 'courier'
        ? {
            streetAddress: form.streetAddress.trim(),
            addressLine1: form.streetAddress.trim(),
            addressLine2: form.addressLine2.trim(),
            suburb: form.suburb.trim(),
            city: form.city.trim(),
            province: form.province.trim(),
            postalCode: form.postalCode.trim(),
            postal_code: form.postalCode.trim(),
            note: form.note.trim(),
          }
        : null;

    const payload = {
      deliveryMethod,
      delivery_method: deliveryMethod,

      customer: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: cleanedPhone,
      },

      customerName: form.name.trim(),
      customerEmail: form.email.trim(),
      customerPhone: cleanedPhone,

      deliveryAddress,
      address: deliveryAddress,

      collectionNote: deliveryMethod === 'collection' ? form.note.trim() : '',
      note: form.note.trim(),

      items: normalizedItems,

      subtotal: safeSubtotal,
      totalWeight: safeTotalWeight,
      deliveryFee: safeDeliveryFee,
      total: safeTotal,

      amount: safeTotal,
      amount_cents: Math.round(safeTotal * 100),
      currency: 'ZAR',
    };

    try {
      setPlacing(true);

      console.log('Checkout payload:', payload);

      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      console.log('create-checkout status:', response.status);
      console.log('create-checkout response:', rawText);

      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            rawText ||
            'Failed to start payment checkout.'
        );
      }

      const redirectUrl = data?.redirectUrl || data?.redirect_url || data?.url;

      if (!redirectUrl) {
        throw new Error('No payment redirect URL was returned.');
      }

      const orderCreatedAt =
        data?.createdAt || data?.created_at || new Date().toISOString();

      const orderSnapshot = {
        orderRef: data?.orderRef || data?.order_id || null,
        createdAt: orderCreatedAt,
        deliveryMethod,
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: cleanedPhone,
        },
        deliveryAddress,
        collectionNote: deliveryMethod === 'collection' ? form.note.trim() : '',
        items: normalizedItems,
        subtotal: safeSubtotal,
        deliveryFee: safeDeliveryFee,
        totalWeight: safeTotalWeight,
        total: safeTotal,
      };

      sessionStorage.setItem('lastOrderDetails', JSON.stringify(orderSnapshot));

      window.location.href = redirectUrl;
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error?.message || 'Something went wrong while starting your payment.');
      setPlacing(false);
    }
  };

  if (cart.length === 0 && step === 'cart') {
    return (
      <div style={pageShell}>
        <Header />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 24 }}>🛒</div>
          <h2
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800,
              fontSize: 30,
              color: '#0f172a',
              marginBottom: 12,
            }}
          >
            Your cart is empty
          </h2>
          <p style={{ color: '#64748b', marginBottom: 32 }}>
            Browse our wholesale catalogue to get started.
          </p>
          <Link
            to="/shop"
            style={{
              background: '#f97316',
              color: 'white',
              textDecoration: 'none',
              padding: '14px 36px',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 16,
              fontFamily: 'Barlow Condensed, sans-serif',
              boxShadow: '0 10px 20px rgba(249, 115, 22, 0.22)',
            }}
          >
            Browse Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={pageShell}>
      <Header />

      <div
        style={{
          maxWidth: 1160,
          margin: '42px auto 56px',
          padding: '0 24px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800,
            fontSize: 42,
            color: '#0f172a',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {step === 'cart' ? '🛒 Your Cart' : <><ClipboardList size={36} /> Checkout</>}
        </h1>

        {step === 'cart' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  style={{
                    ...cardStyle,
                    padding: 20,
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                  }}
                >
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    style={{
                      width: 84,
                      height: 84,
                      objectFit: 'cover',
                      borderRadius: 12,
                      flexShrink: 0,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80';
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        margin: '0 0 6px',
                        fontWeight: 700,
                        fontSize: 16,
                        color: '#0f172a',
                        lineHeight: 1.3,
                      }}
                    >
                      {product.name}
                    </h3>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>
                      SKU: {product.sku || 'N/A'}
                    </p>
                    <p style={{ margin: '5px 0 0', color: '#94a3b8', fontSize: 12 }}>
                      Weight: {toSafeNumber((product as any).weightKg).toFixed(2)} kg each
                    </p>
                    <p
                      style={{
                        margin: '8px 0 0',
                        color: '#f97316',
                        fontWeight: 800,
                        fontSize: 17,
                      }}
                    >
                      R{toSafeNumber(product.price).toFixed(2)} each
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #dbe3ee',
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: '#f8fafc',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => updateCartQty(product.id, quantity - 1)}
                        style={{
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 700,
                          color: '#334155',
                        }}
                      >
                        −
                      </button>
                      <span style={{ padding: '8px 14px', fontWeight: 700, color: '#0f172a' }}>
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(product.id, quantity + 1)}
                        style={{
                          padding: '8px 12px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 700,
                          color: '#334155',
                        }}
                      >
                        +
                      </button>
                    </div>

                    <span
                      style={{
                        fontWeight: 800,
                        color: '#1a2e7a',
                        fontSize: 16,
                        minWidth: 88,
                        textAlign: 'right',
                      }}
                    >
                      R{(toSafeNumber(product.price) * quantity).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      style={{
                        background: '#fff1f2',
                        color: '#ef4444',
                        border: '1px solid #ffe4e6',
                        borderRadius: 12,
                        padding: 9,
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                ...cardStyle,
                padding: 26,
                height: 'fit-content',
                position: 'sticky',
                top: 100,
              }}
            >
              <h3
                style={{
                  margin: '0 0 20px',
                  fontWeight: 800,
                  fontSize: 19,
                  color: '#0f172a',
                }}
              >
                Order Summary
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  paddingBottom: 18,
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: 18,
                }}
              >
                {cart.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: '#475569',
                      gap: 12,
                    }}
                  >
                    <span style={{ lineHeight: 1.4 }}>
                      {product.name} × {quantity}
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      R{(toSafeNumber(product.price) * quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 10, color: '#475569' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 700 }}>R{cartTotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 10, color: '#475569' }}>
                <span>Total Weight</span>
                <span style={{ fontWeight: 700 }}>{cartWeight.toFixed(2)} kg</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 18, color: '#475569' }}>
                <span>Courier</span>
                <span style={{ fontWeight: 700 }}>
                  {deliveryMethod === 'collection' ? 'R0.00' : `R${deliveryFee.toFixed(2)}`}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 900,
                  fontSize: 24,
                  color: '#1a2e7a',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  marginBottom: 22,
                  paddingTop: 16,
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <span>Total</span>
                <span>R{orderTotal.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={() => setStep('checkout')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  padding: '15px 0',
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontFamily: 'Barlow Condensed, sans-serif',
                  boxShadow: '0 14px 24px rgba(249, 115, 22, 0.22)',
                }}
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>

              <Link
                to="/shop"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: 14,
                  color: '#64748b',
                  textDecoration: 'none',
                  fontSize: 13,
                }}
              >
                ← Continue shopping
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 22, alignItems: 'start' }}>
            <form
              onSubmit={handleOrder}
              style={{
                ...cardStyle,
                padding: 30,
              }}
            >
              <h3 style={sectionTitleStyle}>Delivery Details</h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                  marginBottom: 28,
                }}
              >
                {(['courier', 'collection'] as const).map(method => {
                  const selected = deliveryMethod === method;

                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setDeliveryMethod(method)}
                      style={{
                        padding: 18,
                        border: `1.5px solid ${selected ? '#fdba74' : '#e2e8f0'}`,
                        borderRadius: 16,
                        background: selected
                          ? 'linear-gradient(180deg, #fff7ed 0%, #fffbf7 100%)'
                          : '#f8fafc',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        transition: 'all 0.2s ease',
                        boxShadow: selected ? '0 8px 18px rgba(249, 115, 22, 0.08)' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          display: 'grid',
                          placeItems: 'center',
                          background: selected ? '#fff' : '#eef2f7',
                          border: `1px solid ${selected ? '#fed7aa' : '#e2e8f0'}`,
                          flexShrink: 0,
                        }}
                      >
                        {method === 'courier' ? (
                          <Truck size={20} color={selected ? '#f97316' : '#94a3b8'} />
                        ) : (
                          <Store size={20} color={selected ? '#f97316' : '#94a3b8'} />
                        )}
                      </div>

                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 16,
                            color: selected ? '#ea580c' : '#0f172a',
                            marginBottom: 2,
                          }}
                        >
                          {method === 'courier' ? 'Courier' : 'Collection'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {method === 'courier' ? 'Delivered to your address' : 'Pick up in Vereeniging'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  placeholder="Your name or business name"
                  style={inputBaseStyle}
                  onFocus={e => setFocusedStyle(e.target as HTMLInputElement)}
                  onBlur={e => setBlurredStyle(e.target as HTMLInputElement)}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                  marginBottom: 18,
                }}
              >
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => handleFieldChange('email', e.target.value)}
                    placeholder="your@email.com"
                    style={inputBaseStyle}
                    onFocus={e => setFocusedStyle(e.target as HTMLInputElement)}
                    onBlur={e => setBlurredStyle(e.target as HTMLInputElement)}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={e => handleFieldChange('phone', e.target.value)}
                    placeholder="082 555 1234"
                    style={inputBaseStyle}
                    onFocus={e => setFocusedStyle(e.target as HTMLInputElement)}
                    onBlur={e => setBlurredStyle(e.target as HTMLInputElement)}
                  />
                </div>
              </div>

              {deliveryMethod === 'courier' ? (
                <>
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Street Address</label>
                    <input
                      type="text"
                      required
                      value={form.streetAddress}
                      onChange={e => handleFieldChange('streetAddress', e.target.value)}
                      placeholder="12 Main Street"
                      style={inputBaseStyle}
                      onFocus={e => setFocusedStyle(e.target as HTMLInputElement)}
                      onBlur={e => setBlurredStyle(e.target as HTMLInputElement)}
                    />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Address Line 2</label>
                    <input
                      type="text"
                      value={form.addressLine2}
                      onChange={e => handleFieldChange('addressLine2', e.target.value)}
                      placeholder="Complex, unit, apartment, etc. (optional)"
                      style={inputBaseStyle}
                      onFocus={e => setFocusedStyle(e.target as HTMLInputElement)}
                      onBlur={e => setBlurredStyle(e.target as HTMLInputElement)}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Suburb</label>
                      <input
                        type="text"
                        required
                        value={form.suburb}
                        onChange={e => handleFieldChange('suburb', e.target.value)}
                        placeholder="Three Rivers"
                        style={inputBaseStyle}
                        onFocus={e => setFocusedStyle(e.target as HTMLInputElement)}
                        onBlur={e => setBlurredStyle(e.target as HTMLInputElement)}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>City / Town</label>
                      <input
                        type="text"
                        required
                        value={form.city}
                        onChange={e => handleFieldChange('city', e.target.value)}
                        placeholder="Vereeniging"
                        style={inputBaseStyle}
                        onFocus={e => setFocusedStyle(e.target as HTMLInputElement)}
                        onBlur={e => setBlurredStyle(e.target as HTMLInputElement)}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Province</label>
                      <input
                        type="text"
                        required
                        value={form.province}
                        onChange={e => handleFieldChange('province', e.target.value)}
                        placeholder="Gauteng"
                        style={inputBaseStyle}
                        onFocus={e => setFocusedStyle(e.target as HTMLInputElement)}
                        onBlur={e => setBlurredStyle(e.target as HTMLInputElement)}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Postal Code</label>
                      <input
                        type="text"
                        required
                        value={form.postalCode}
                        onChange={e => handleFieldChange('postalCode', e.target.value)}
                        placeholder="1939"
                        style={inputBaseStyle}
                        onFocus={e => setFocusedStyle(e.target as HTMLInputElement)}
                        onBlur={e => setBlurredStyle(e.target as HTMLInputElement)}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Delivery Notes</label>
                    <textarea
                      value={form.note}
                      onChange={e => handleFieldChange('note', e.target.value)}
                      placeholder="Gate code, landmarks, or special instructions"
                      rows={4}
                      style={{ ...inputBaseStyle, resize: 'vertical', minHeight: 108 }}
                      onFocus={e => setFocusedStyle(e.target as HTMLTextAreaElement)}
                      onBlur={e => setBlurredStyle(e.target as HTMLTextAreaElement)}
                    />
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Collection Note</label>
                  <textarea
                    value={form.note}
                    onChange={e => handleFieldChange('note', e.target.value)}
                    placeholder="Anything we should know before collection?"
                    rows={4}
                    style={{ ...inputBaseStyle, resize: 'vertical', minHeight: 108 }}
                    onFocus={e => setFocusedStyle(e.target as HTMLTextAreaElement)}
                    onBlur={e => setBlurredStyle(e.target as HTMLTextAreaElement)}
                  />
                </div>
              )}

              <div
                style={{
                  marginTop: 10,
                  marginBottom: 18,
                  padding: 18,
                  borderRadius: 16,
                  background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: '#475569' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 700 }}>R{cartTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: '#475569' }}>
                  <span>Total Weight</span>
                  <span style={{ fontWeight: 700 }}>{cartWeight.toFixed(2)} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: '#475569' }}>
                  <span>{deliveryMethod === 'courier' ? 'Courier' : 'Collection'}</span>
                  <span style={{ fontWeight: 700 }}>
                    {deliveryMethod === 'collection' ? 'R0.00' : `R${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 12,
                    marginTop: 12,
                    borderTop: '1px solid #dbe3ee',
                    fontWeight: 800,
                    color: '#1a2e7a',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: 22,
                  }}
                >
                  <span>Total</span>
                  <span>R{orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={placing}
                style={{
                  width: '100%',
                  background: placing
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  padding: '15px 0',
                  fontWeight: 800,
                  fontSize: 18,
                  cursor: placing ? 'not-allowed' : 'pointer',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  marginTop: 8,
                  boxShadow: placing ? 'none' : '0 14px 24px rgba(249, 115, 22, 0.20)',
                }}
              >
                {placing ? 'Redirecting to payment...' : '🔒 Pay with Yoco — R' + orderTotal.toFixed(2)}
              </button>

              <button
                type="button"
                onClick={() => setStep('cart')}
                style={{
                  display: 'block',
                  margin: '14px auto 0',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                ← Back to cart
              </button>
            </form>

            <div
              style={{
                ...cardStyle,
                padding: 22,
                height: 'fit-content',
                position: 'sticky',
                top: 100,
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px',
                  fontWeight: 800,
                  fontSize: 17,
                  color: '#0f172a',
                }}
              >
                Order ({cart.length} items)
              </h3>

              {cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 14,
                    alignItems: 'center',
                  }}
                >
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    style={{
                      width: 46,
                      height: 46,
                      objectFit: 'cover',
                      borderRadius: 10,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      flexShrink: 0,
                    }}
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80';
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#1e293b',
                        lineHeight: 1.35,
                      }}
                    >
                      {product.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      ×{quantity} — R{(toSafeNumber(product.price) * quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8, color: '#475569' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 700 }}>R{cartTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8, color: '#475569' }}>
                  <span>Total Weight</span>
                  <span style={{ fontWeight: 700 }}>{cartWeight.toFixed(2)} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8, color: '#475569' }}>
                  <span>{deliveryMethod === 'courier' ? 'Courier' : 'Collection'}</span>
                  <span style={{ fontWeight: 700 }}>
                    {deliveryMethod === 'collection' ? 'R0.00' : `R${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 900,
                    fontSize: 21,
                    color: '#1a2e7a',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    paddingTop: 10,
                    marginTop: 10,
                    borderTop: '1px solid #e2e8f0',
                  }}
                >
                  <span>Total</span>
                  <span>R{orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}