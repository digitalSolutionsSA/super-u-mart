import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function WholesaleAuth() {
  const [isLogin, setIsLogin] = useState(true);

  const DARK_BLUE = "#111d5e";
  const ACCENT_ORANGE = "#f97316";

  return (
    <>
      <Header />

      <div
        style={{
          minHeight: "90vh",
          background: "#f3f4f6",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 500,
            background: "#ffffff",
            borderRadius: 16,
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            padding: 40,
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 10,
              color: DARK_BLUE,
            }}
          >
            {isLogin ? "Wholesale Login" : "Create Wholesale Account"}
          </h2>

          <p style={{ marginBottom: 30, color: "#555" }}>
            {isLogin
              ? "Access your wholesale dashboard."
              : "Company details are required. Retail customers cannot register."}
          </p>

          <form style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Company Name"
                  required
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Company Registration Number"
                  required
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="VAT Number (if applicable)"
                  style={inputStyle}
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email Address"
              required
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Password"
              required
              style={inputStyle}
            />

            <button
              type="submit"
              style={{
                background: ACCENT_ORANGE,
                color: "#fff",
                padding: "12px",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                marginTop: 10,
              }}
            >
              {isLogin ? "Login" : "Register Company"}
            </button>
          </form>

          <div
            style={{
              marginTop: 25,
              textAlign: "center",
              fontSize: 14,
            }}
          >
            {isLogin ? (
              <>
                Don’t have a wholesale account?{" "}
                <span
                  onClick={() => setIsLogin(false)}
                  style={{
                    color: ACCENT_ORANGE,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Register here
                </span>
              </>
            ) : (
              <>
                Already registered?{" "}
                <span
                  onClick={() => setIsLogin(true)}
                  style={{
                    color: ACCENT_ORANGE,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Login here
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 14,
};