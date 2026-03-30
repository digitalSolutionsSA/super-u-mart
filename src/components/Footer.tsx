import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock } from 'lucide-react';

function Footer() {
  return (
    <footer style={{ background: '#111d5e', color: '#94a3b8', marginTop: 'auto' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '48px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 40,
        }}
      >
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 12 }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 22, color: 'white' }}>
              Super
            </span>
            <span style={{
              background: '#f97316',
              color: 'white',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800,
              fontSize: 22,
              padding: '0 5px',
              margin: '0 3px',
              borderRadius: 3,
            }}>
              Ü
            </span>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 22, color: 'white' }}>
              Mart
            </span>
          </div>

          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            Wholesale essentials, hardware, and more. Built for fast ordering.
          </p>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={14} />
              Vereeniging Industrial
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={14} />
              084 988 8800
            </span>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Clock size={14} style={{ marginTop: 2 }} />
              <div>
                <div>Monday–Friday | 07:30 – 17:30</div>
                <div>Saturday | 07:30 – 15:00</div>
                <div>Sunday / Public Holidays | 07:30 – 14:00</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: 14, textTransform: 'uppercase' }}>
            Quick Links
          </h4>

          {['/', '/shop', '/deals', '/contact'].map((path, i) => {
            const labels = ['Home', 'Shop', 'Deals', 'Contact'];
            return (
              <Link key={path} to={path} style={{ display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
                {labels[i]}
              </Link>
            );
          })}
        </div>

        {/* Support */}
        <div>
          <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: 14, textTransform: 'uppercase' }}>
            Support
          </h4>

          <Link to="/disclaimer" style={{ display: 'block', color: '#94a3b8', fontSize: 13 }}>
            Terms & Disclaimer
          </Link>
        </div>

        {/* For Resellers */}
        <div>
          <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: 14, textTransform: 'uppercase' }}>
            For Resellers
          </h4>

          <p style={{ fontSize: 13, lineHeight: 1.7 }}>
            If you are a reseller and would like to apply to become a Super Ü Mart reseller,
            please contact us directly:
          </p>

          <div style={{ marginTop: 12, fontSize: 13 }}>
            <div><strong style={{ color: 'white' }}>WhatsApp:</strong> 084 988 8800</div>
            <div><strong style={{ color: 'white' }}>Email:</strong> superumartwebsite@gmail.com</div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: 16, textAlign: 'center', fontSize: 12 }}>
        © {new Date().getFullYear()} Super Ü Mart. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;