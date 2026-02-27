import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import { useAdminAuth } from "../context/AdminAuthContext";

const DARK_BLUE = "#111d5e";
const ACCENT_ORANGE = "#f97316";

// Vite/public images should be referenced from root:
const ADMIN_BG_IMAGE = "/categories/warehouse-bg.png";

function PillLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/admin"}
      className={({ isActive }) =>
        [
          "px-5 py-2 rounded-full text-sm font-extrabold uppercase tracking-wide transition",
          isActive ? "text-white" : "text-white/95 hover:text-white",
        ].join(" ")
      }
      style={({ isActive }) => ({
        background: isActive ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.18)",
        boxShadow: isActive ? "0 10px 22px rgba(0,0,0,0.18)" : "none",
      })}
    >
      {label}
    </NavLink>
  );
}

function TopLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-3 py-1.5 rounded-full text-sm font-extrabold uppercase tracking-wide transition",
          isActive ? "text-white" : "text-white/90 hover:text-white",
        ].join(" ")
      }
      style={({ isActive }) => ({
        background: isActive ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: isActive ? "0 10px 22px rgba(0,0,0,0.12)" : "none",
      })}
    >
      {label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const onLogout = async () => {
    try {
      await logout?.();
    } finally {
      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: DARK_BLUE }}>
      {/* Full site navbar */}
      <Header />

      {/* Admin strip */}
      <div
        className="w-full"
        style={{
          background: `linear-gradient(90deg, ${ACCENT_ORANGE} 0%, #ff8a2a 55%, ${ACCENT_ORANGE} 100%)`,
          boxShadow: "0 10px 26px rgba(0,0,0,0.16)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between gap-3 py-3 flex-wrap">
            <div className="text-white font-extrabold text-lg">Admin Panel</div>

            {/* Featured + On Sale + Admin nav */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {/* Admin Products quick filters (NOT customer shop) */}
              <div className="flex items-center gap-2 flex-wrap">
                <TopLink to="/admin/products?filter=featured" label="featured" />
                <TopLink to="/admin/products?filter=sale" label="on sale" />
              </div>

              {/* Divider */}
              <div
                className="hidden sm:block"
                style={{
                  width: 1,
                  height: 28,
                  background: "rgba(255,255,255,0.25)",
                  marginInline: 6,
                }}
              />

              {/* Admin links */}
              <div className="flex items-center gap-3 flex-wrap">
                <PillLink to="/admin" label="dashboard" />
                <PillLink to="/admin/products" label="products" />
                <PillLink to="/admin/orders" label="orders" />
              </div>
            </div>

            <button
              onClick={onLogout}
              className="px-6 py-2 rounded-full font-extrabold text-sm uppercase tracking-wide text-white transition hover:brightness-110 active:scale-[0.99]"
              style={{
                background: DARK_BLUE,
                boxShadow: "0 10px 22px rgba(17,29,94,0.35)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              logout
            </button>
          </div>
        </div>
      </div>

      {/* Hero-like admin background */}
      <div
        style={{
          position: "relative",
          backgroundColor: DARK_BLUE,
          minHeight: "calc(100vh - 160px)",
        }}
      >
        {/* Background image (DIMMED) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${ADMIN_BG_IMAGE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.35,
            filter: "blur(1px) saturate(0.9) contrast(0.95)",
          }}
        />

        {/* Darker blue overlay (VISIBILITY FIX) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(17,29,94,0.92) 0%, rgba(17,29,94,0.82) 55%, rgba(17,29,94,0.78) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="mx-auto max-w-7xl px-4 py-6">
            {/* Less transparent / more readable shell */}
            <div className="rounded-2xl border border-white/25 bg-white/16 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.30)] backdrop-blur-md md:p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}