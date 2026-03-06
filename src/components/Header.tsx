import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Shield } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAdminAuth } from '../context/AdminAuthContext';

interface HeaderProps {
  onSearch?: (q: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const { cartCount } = useStore();
  const { user: adminUser } = useAdminAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchVal);
    else navigate(`/shop?q=${encodeURIComponent(searchVal)}`);
  };

  const DARK_BLUE = '#111d5e';
  const ACCENT_ORANGE = '#f97316';

  const adminHref = useMemo(() => (adminUser ? '/admin' : '/admin/login'), [adminUser]);

  // ✅ Removed Categories from the nav
  const navLinks = useMemo(
    () => [
      { path: '/', label: 'Home' },
      { path: '/shop', label: 'Shop' },
      { path: '/deals', label: 'Deals' },
      { path: '/about', label: 'About' },
      { path: '/contact', label: 'Contact' },
      // NOTE: removed /admin from this bottom nav to avoid duplication + confusion
    ],
    []
  );

  return (
    <header
      style={{
        background: DARK_BLUE,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Main header */}
      <div
        style={{
          padding: '22px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span
              style={{
                fontFamily: 'Barlow Condensed, Barlow, sans-serif',
                fontWeight: 800,
                fontSize: 28,
                color: 'white',
                letterSpacing: '-0.5px',
              }}
            >
              Super
            </span>

            <span
              style={{
                background: ACCENT_ORANGE,
                color: 'white',
                fontFamily: 'Barlow Condensed, Barlow, sans-serif',
                fontWeight: 800,
                fontSize: 28,
                padding: '0 6px',
                margin: '0 4px',
                borderRadius: 4,
                position: 'relative',
              }}
            >
              Ü
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: 2,
                  fontSize: 10,
                  color: '#22c55e',
                }}
              >
                🌿
              </span>
            </span>

            <span
              style={{
                fontFamily: 'Barlow Condensed, Barlow, sans-serif',
                fontWeight: 800,
                fontSize: 28,
                color: 'white',
                letterSpacing: '-0.5px',
              }}
            >
              Mart
            </span>
          </div>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 0, maxWidth: 600 }}>
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search products... (e.g. 'toilet paper', 'drill')"
            style={{
              flex: 1,
              padding: '14px 18px',
              border: 'none',
              borderRadius: '6px 0 0 6px',
              fontSize: 14,
              outline: 'none',
              fontFamily: 'Barlow, sans-serif',
            }}
          />
          <button
            type="submit"
            style={{
              background: ACCENT_ORANGE,
              color: 'white',
              border: 'none',
              padding: '14px 26px',
              borderRadius: '0 6px 6px 0',
              cursor: 'pointer',
              fontFamily: 'Barlow, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Search size={16} />
            Search
          </button>
        </form>

        {/* Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {/* Account -> Wholesale Auth */}
          <Link
            to="/wholesale-auth"
            style={{
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              opacity: 0.95,
            }}
            title="Wholesale Login / Register"
          >
            <User size={22} />
            Account
          </Link>

          {/* Admin (smart link) */}
          <Link
            to={adminHref}
            style={{
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              opacity: 0.92,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = ACCENT_ORANGE;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'white';
            }}
            title={adminUser ? 'Admin Portal' : 'Admin Login'}
          >
            <Shield size={22} />
            Admin
          </Link>

          <Link
            to="/cart"
            style={{
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              position: 'relative',
              opacity: 0.95,
            }}
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -8,
                  background: ACCENT_ORANGE,
                  color: 'white',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {cartCount}
              </span>
            )}
            Cart
          </Link>
        </div>

        {/* Mobile menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: 4,
          }}
          className="mobile-menu-btn"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Nav bar */}
      <nav
        style={{
          background: DARK_BLUE,
          padding: '0 24px',
          display: 'flex',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {navLinks.map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            style={{
              color: '#cbd5e1',
              textDecoration: 'none',
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'Barlow, sans-serif',
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = ACCENT_ORANGE;
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#cbd5e1';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}