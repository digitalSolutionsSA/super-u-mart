import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useStore } from '../context/StoreContext';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const { orders } = useStore();
  const order = orders.find(o => o.id === id);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Barlow, sans-serif' }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 48, maxWidth: 560, width: '100%', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <CheckCircle size={64} color="#22c55e" style={{ marginBottom: 20 }} />
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 36, color: '#1e293b', margin: '0 0 12px' }}>Order Placed!</h1>
          <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
            Thank you! Your wholesale order has been received. We'll contact you to confirm delivery details.
          </p>
          {order && (
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 28, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Order ID</span>
                <span style={{ fontWeight: 700, color: '#1a2e7a' }}>{order.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Customer</span>
                <span style={{ fontWeight: 600 }}>{order.customer.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Delivery</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{order.deliveryMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 8 }}>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>Total</span>
                <span style={{ fontWeight: 900, color: '#f97316', fontSize: 20 }}>R{order.total.toFixed(2)}</span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a2e7a', color: 'white', textDecoration: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700 }}>
              <Home size={16} /> Home
            </Link>
            <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f97316', color: 'white', textDecoration: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700 }}>
              <ShoppingBag size={16} /> Shop More
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
