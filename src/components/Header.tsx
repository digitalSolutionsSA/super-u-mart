import React, { useEffect, useMemo, useState } from 'react';
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
  const [screenWidth, setScreenWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => {
      setScreenWidth(window.innerWidth);
      if (window.innerWidth > 900) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = screenWidth <= 900;
  const isSmallMobile = screenWidth <= 560;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchVal.trim();

    if (onSearch) onSearch(trimmed);
    else navigate(`/shop?q=${encodeURIComponent(trimmed)}`);

    if (isMobile) {
      setMenuOpen(false);
    }
  };

  const DARK_BLUE = '#111d5e';
  const ACCENT_ORANGE = '#f97316';

  const adminHref = useMemo(() => (adminUser ? '/admin' : '/admin/login'), [adminUser]);

  const navLinks = useMemo(
    () => [
      { path: '/', label: 'Home' },
      { path: '/shop', label: 'Shop' },
      { path: '/deals', label: 'Deals' },
      { path: '/about', label: 'About' },
      { path: '/contact', label: 'Contact' },
    ],
    []
  );

  const actionLinkStyle: React.CSSProperties = {
    color: 'white',
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontSize: 12,
    opacity: 0.95,
    minWidth: isSmallMobile ? 52 : 58,
    position: 'relative',
    flexShrink: 0,
  };

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
      <div
        style={{
          padding: isMobile ? '14px 16px' : '22px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 12 : 20,
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span
              style={{
                fontFamily: 'Barlow Condensed, Barlow, sans-serif',
                fontWeight: 800,
                fontSize: isSmallMobile ? 22 : isMobile ? 24 : 28,
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
                fontSize: isSmallMobile ? 22 : isMobile ? 24 : 28,
                padding: isSmallMobile ? '0 5px' : '0 6px',
                margin: '0 4px',
                borderRadius: 4,
                position: 'relative',
                lineHeight: 1.1,
              }}
            >
              Ü
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: 2,
                  fontSize: isSmallMobile ? 8 : 10,
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
                fontSize: isSmallMobile ? 22 : isMobile ? 24 : 28,
                color: 'white',
                letterSpacing: '-0.5px',
              }}
            >
              Mart
            </span>
          </div>
        </Link>

        {!isMobile && (
          <form
            onSubmit={handleSearch}
            style={{ flex: 1, display: 'flex', gap: 0, maxWidth: 600 }}
          >
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
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 8 : 16,
            flexShrink: 0,
            marginLeft: 'auto',
          }}
        >
          {!isMobile && (
            <>
              <Link
                to="/wholesale-auth"
                style={actionLinkStyle}
                title="Wholesale Login / Register"
              >
                <User size={22} />
                Account
              </Link>

              <Link
                to={adminHref}
                style={actionLinkStyle}
                title={adminUser ? 'Admin Portal' : 'Admin Login'}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = ACCENT_ORANGE;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'white';
                }}
              >
                <Shield size={22} />
                Admin
              </Link>
            </>
          )}

          <Link
            to="/cart"
            style={actionLinkStyle}
            onClick={() => setMenuOpen(false)}
          >
            <ShoppingCart size={isMobile ? 20 : 22} />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  right: isMobile ? 2 : -8,
                  background: ACCENT_ORANGE,
                  color: 'white',
                  borderRadius: '50%',
                  minWidth: 18,
                  height: 18,
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              >
                {cartCount}
              </span>
            )}
            Cart
          </Link>

          {isMobile && (
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: 'white',
                cursor: 'pointer',
                padding: 10,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {!isMobile && (
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
      )}

      {isMobile && menuOpen && (
        <div
          style={{
            background: '#0d1748',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '14px 16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search products..."
              style={{
                width: '100%',
                padding: '14px 16px',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
                fontFamily: 'Barlow, sans-serif',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              style={{
                background: ACCENT_ORANGE,
                color: 'white',
                border: 'none',
                padding: '14px 16px',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Search size={16} />
              Search
            </button>
          </form>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <Link
              to="/wholesale-auth"
              onClick={() => setMenuOpen(false)}
              style={{
                color: 'white',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '14px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              <User size={18} />
              Account
            </Link>

            <Link
              to={adminHref}
              onClick={() => setMenuOpen(false)}
              style={{
                color: 'white',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '14px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              <Shield size={18} />
              Admin
            </Link>
          </div>

          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: 8,
            }}
          >
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: '#e2e8f0',
                  textDecoration: 'none',
                  padding: '14px 6px',
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: 'Barlow, sans-serif',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}