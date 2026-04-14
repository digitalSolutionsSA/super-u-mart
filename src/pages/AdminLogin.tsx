import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, LogIn } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAdminAuth } from "../context/AdminAuthContext";

const DARK_BLUE = "#111d5e";
const ACCENT_ORANGE = "#f97316";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, user } = useAdminAuth() as any;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      // Adjust this if your context uses a different function name.
      await login?.(email, password);
      navigate("/admin", { replace: true });
    } catch (error: any) {
      setErr(error?.message ?? "Login failed. Check details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main
        style={{
          minHeight: "70vh",
          background:
            "linear-gradient(180deg, rgba(17,29,94,0.08) 0%, rgba(17,29,94,0.02) 60%, rgba(17,29,94,0.00) 100%)",
          padding: "28px 16px",
        }}
      >
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 18,
              padding: 18,
              background: `linear-gradient(135deg, ${DARK_BLUE} 0%, rgba(17,29,94,0.82) 60%, rgba(17,29,94,0.70) 100%)`,
              color: "white",
              boxShadow: "0 16px 40px rgba(17,29,94,0.18)",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.14)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Lock size={18} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.4 }}>
                  Admin Login
                </div>
                <div style={{ opacity: 0.9, marginTop: 2, fontSize: 13 }}>
                  Sign in to manage products, images, prices, and featured deals.
                </div>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl border bg-white p-5 shadow-sm"
            style={{ borderColor: "rgba(17,29,94,0.12)" }}
          >
            {err && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {err}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-600">Email</div>
                <div className="mt-1 flex items-center gap-2 rounded-xl border px-3 py-2">
                  <Mail size={16} className="text-slate-500" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full outline-none text-sm"
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600">Password</div>
                <div className="mt-1 flex items-center gap-2 rounded-xl border px-3 py-2">
                  <Lock size={16} className="text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full outline-none text-sm"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-white transition"
                style={{
                  backgroundColor: ACCENT_ORANGE,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <LogIn size={18} />
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <div className="text-center text-xs text-slate-500">
                This area is for admins. If you’re not one, you’re lost. Politely.
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}