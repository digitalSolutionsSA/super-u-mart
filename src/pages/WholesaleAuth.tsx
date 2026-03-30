import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function WholesaleAuth() {
  const DARK_BLUE = "#111d5e";

  return (
    <>
      <Header />

      <div
        style={{
          minHeight: "90vh",
          backgroundImage:
            "linear-gradient(rgba(17, 29, 94, 0.82), rgba(17, 29, 94, 0.82)), url('/categories/warehouse-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
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
            textAlign: "center",
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
            Coming Soon
          </h2>

          <p
            style={{
              margin: 0,
              color: "#555",
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            Account features are currently under development.
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}