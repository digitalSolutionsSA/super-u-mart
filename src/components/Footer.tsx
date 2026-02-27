import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#111d5e', color: '#94a3b8', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40 }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 12 }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 22, color: 'white' }}>Super</span>
            <span style={{ background: '#f97316', color: 'white', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 22, padding: '0 5px', margin: '0 3px', borderRadius: 3 }}>Ü</span>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 22, color: 'white' }}>Mart</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>Wholesale essentials, hardware, and more. Built for fast ordering.</p>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={14} /> Vereeniging Industrial</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} /> 063 903 4514</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={14} /> Mon–Sat, 7am–5pm</span>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 style={{ color: 'white', fontFamily: 'Barlow, sans-serif', fontWeight: 700, marginBottom: 16, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Links</h4>
          {['/', '/shop', '/deals', '/categories', '/contact'].map((path, i) => {
            const labels = ['Home', 'Shop', 'Deals', 'Categories', 'Contact'];
            return (
              <Link key={path} to={path} style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', fontSize: 13, marginBottom: 8, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#f97316'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = '#94a3b8'}
              >{labels[i]}</Link>
            );
          })}
        </div>

        {/* Support */}
        <div>
          <h4 style={{ color: 'white', fontFamily: 'Barlow, sans-serif', fontWeight: 700, marginBottom: 16, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Support</h4>
          {['Help', 'Returns', 'Delivery', 'Terms', 'Privacy'].map(item => (
            <Link key={item} to={`/${item.toLowerCase()}`} style={{ display: 'block', color: '#94a3b8', textDecoration: 'none', fontSize: 13, marginBottom: 8, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#f97316'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#94a3b8'}
            >{item}</Link>
          ))}
        </div>

        {/* For Resellers */}
        <div>
          <h4 style={{ color: 'white', fontFamily: 'Barlow, sans-serif', fontWeight: 700, marginBottom: 16, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>For Resellers</h4>
          <p style={{ fontSize: 13, lineHeight: 1.7 }}>
            Create a wholesale account to access bulk pricing, track orders, and get fast courier delivery to your door.
          </p>
          <Link to="/register" style={{
            display: 'inline-block',
            marginTop: 12,
            background: '#f97316',
            color: 'white',
            textDecoration: 'none',
            padding: '8px 20px',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'Barlow, sans-serif',
          }}>Register now</Link>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', textAlign: 'center', fontSize: 12 }}>
        © {new Date().getFullYear()} Super Ü Mart. All rights reserved. Wholesale only.
      </div>
    </footer>
  );
}
