import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Truck, Store } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useStore } from '../context/StoreContext';

export default function CartPage() {
  const { cart, removeFromCart, updateCartQty, cartTotal, placeOrder } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [deliveryMethod, setDeliveryMethod] = useState<'courier' | 'collection'>('courier');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [placing, setPlacing] = useState(false);

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    setTimeout(() => {
      const order = placeOrder(form, deliveryMethod);
      navigate(`/order-success/${order.id}`);
    }, 1200);
  };

  if (cart.length === 0 && step === 'cart') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Barlow, sans-serif' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🛒</div>
          <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 28, color: '#1e293b', marginBottom: 12 }}>Your cart is empty</h2>
          <p style={{ color: '#64748b', marginBottom: 32 }}>Browse our wholesale catalogue to get started.</p>
          <Link to="/shop" style={{ background: '#f97316', color: 'white', textDecoration: 'none', padding: '14px 36px', borderRadius: 8, fontWeight: 800, fontSize: 16, fontFamily: 'Barlow Condensed, sans-serif' }}>
            Browse Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Barlow, sans-serif' }}>
      <Header />

      <div style={{ maxWidth: 1100, margin: '40px auto', padding: '0 24px', width: '100%' }}>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 36, color: '#1e293b', marginBottom: 32 }}>
          {step === 'cart' ? '🛒 Your Cart' : '📋 Checkout'}
        </h1>

        {step === 'cart' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            {/* Cart items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {cart.map(({ product, quantity }) => (
                <div key={product.id} style={{ background: 'white', borderRadius: 12, padding: 20, display: 'flex', gap: 16, border: '1px solid #e2e8f0', alignItems: 'center' }}>
                  <img src={product.imageUrl} alt={product.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{product.name}</h3>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>SKU: {product.sku}</p>
                    <p style={{ margin: '4px 0 0', color: '#f97316', fontWeight: 800, fontSize: 16 }}>R{product.price.toFixed(2)} each</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                      <button onClick={() => updateCartQty(product.id, quantity - 1)} style={{ padding: '6px 12px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}>−</button>
                      <span style={{ padding: '6px 14px', fontWeight: 700 }}>{quantity}</span>
                      <button onClick={() => updateCartQty(product.id, quantity + 1)} style={{ padding: '6px 12px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+</button>
                    </div>
                    <span style={{ fontWeight: 800, color: '#1a2e7a', fontSize: 16, minWidth: 80, textAlign: 'right' }}>
                      R{(product.price * quantity).toFixed(2)}
                    </span>
                    <button onClick={() => removeFromCart(product.id)} style={{ background: '#fff1f2', color: '#ef4444', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0', height: 'fit-content', position: 'sticky', top: 100 }}>
              <h3 style={{ margin: '0 0 20px', fontWeight: 800, fontSize: 18, color: '#1e293b' }}>Order Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16, borderBottom: '2px solid #f1f5f9', marginBottom: 16 }}>
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569' }}>
                    <span>{product.name} × {quantity}</span>
                    <span style={{ fontWeight: 600 }}>R{(product.price * quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 22, color: '#1a2e7a', fontFamily: 'Barlow Condensed, sans-serif', marginBottom: 20 }}>
                <span>Total</span>
                <span>R{cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setStep('checkout')}
                style={{ width: '100%', background: '#f97316', color: 'white', border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>
              <Link to="/shop" style={{ display: 'block', textAlign: 'center', marginTop: 14, color: '#64748b', textDecoration: 'none', fontSize: 13 }}>
                ← Continue shopping
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            <form onSubmit={handleOrder} style={{ background: 'white', borderRadius: 12, padding: 32, border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 24px', fontWeight: 800, fontSize: 20, color: '#1e293b' }}>Delivery Details</h3>

              {/* Delivery method */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                {(['courier', 'collection'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setDeliveryMethod(method)}
                    style={{
                      padding: 20, border: `2px solid ${deliveryMethod === method ? '#f97316' : '#e2e8f0'}`,
                      borderRadius: 10, background: deliveryMethod === method ? '#fff7ed' : 'white',
                      cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    {method === 'courier' ? <Truck size={24} color={deliveryMethod === method ? '#f97316' : '#94a3b8'} /> : <Store size={24} color={deliveryMethod === method ? '#f97316' : '#94a3b8'} />}
                    <div style={{ fontWeight: 700, marginTop: 8, color: deliveryMethod === method ? '#f97316' : '#1e293b', textTransform: 'capitalize' }}>{method}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{method === 'courier' ? 'Delivered to you' : 'Pick up in Vereeniging'}</div>
                  </button>
                ))}
              </div>

              {/* Form fields */}
              {[
                { key: 'name', label: 'Full Name', placeholder: 'Your name or business name', type: 'text' },
                { key: 'email', label: 'Email Address', placeholder: 'your@email.com', type: 'email' },
                { key: 'phone', label: 'Phone Number', placeholder: '082 555 1234', type: 'tel' },
                { key: 'address', label: deliveryMethod === 'courier' ? 'Delivery Address' : 'Note (optional)', placeholder: deliveryMethod === 'courier' ? '12 Main Street, Vereeniging' : 'Any special instructions?', type: 'text' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key} style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{label}</label>
                  <input
                    type={type}
                    required={key !== 'address' || deliveryMethod === 'courier'}
                    value={(form as Record<string, string>)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, fontFamily: 'Barlow, sans-serif', boxSizing: 'border-box', outline: 'none' }}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#f97316'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'}
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={placing}
                style={{
                  width: '100%', background: placing ? '#94a3b8' : '#f97316', color: 'white', border: 'none', borderRadius: 10,
                  padding: '14px 0', fontWeight: 800, fontSize: 18, cursor: placing ? 'not-allowed' : 'pointer',
                  fontFamily: 'Barlow Condensed, sans-serif', marginTop: 8,
                }}
              >
                {placing ? 'Placing order...' : '🔒 Place Order — R' + cartTotal.toFixed(2)}
              </button>

              <button type="button" onClick={() => setStep('cart')} style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>
                ← Back to cart
              </button>
            </form>

            {/* Summary sidebar */}
            <div style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0', height: 'fit-content' }}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 16, color: '#1e293b' }}>Order ({cart.length} items)</h3>
              {cart.map(({ product, quantity }) => (
                <div key={product.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <img src={product.imageUrl} alt={product.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }}
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{product.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>×{quantity} — R{(product.price * quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: 14, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 20, color: '#1a2e7a', fontFamily: 'Barlow Condensed, sans-serif' }}>
                <span>Total</span><span>R{cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
