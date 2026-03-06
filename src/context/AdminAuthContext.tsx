import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AdminUser = { email: string };

type LoginResult = { ok: true } | { ok: false; error: string };

type AdminAuthContextValue = {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const LS_ADMIN_KEY = "umart_admin_user";

// change these whenever you want
const ADMIN_EMAIL = "admin@superumart.co.za";
const ADMIN_PASSWORD = "admin123";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Clear any old persistent admin login from previous versions
    localStorage.removeItem(LS_ADMIN_KEY);

    const raw = sessionStorage.getItem(LS_ADMIN_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as AdminUser;
      if (parsed?.email) {
        setUser(parsed);
      } else {
        sessionStorage.removeItem(LS_ADMIN_KEY);
      }
    } catch {
      sessionStorage.removeItem(LS_ADMIN_KEY);
    }
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const e = email.trim().toLowerCase();
    const p = password.trim();

    if (e !== ADMIN_EMAIL.toLowerCase() || p !== ADMIN_PASSWORD) {
      return { ok: false, error: "Invalid email or password." };
    }

    const nextUser = { email: ADMIN_EMAIL };
    setUser(nextUser);

    // Store only for the current browser session
    sessionStorage.setItem(LS_ADMIN_KEY, JSON.stringify(nextUser));

    // Clean up any old persistent login key just in case
    localStorage.removeItem(LS_ADMIN_KEY);

    return { ok: true };
  };

  const logout = async () => {
    setUser(null);
    sessionStorage.removeItem(LS_ADMIN_KEY);
    localStorage.removeItem(LS_ADMIN_KEY);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}