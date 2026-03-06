import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AboutPage() {
  const DARK_BLUE = "#111d5e";
  const ACCENT_ORANGE = "#f97316";

  return (
    <>
      <Header />

      <div
        style={{
          minHeight: "90vh",
          position: "relative",
          backgroundImage: "url('/categories/warehouse-bg.png')", // ✅ correct path from /public
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Dark blue overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(17, 29, 94, 0.85)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "60px 20px",
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* Title */}
            <h1
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "white",
                marginBottom: 20,
              }}
            >
              About Super Ü Mart
            </h1>

            <p
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.85)",
                maxWidth: 700,
                marginBottom: 50,
              }}
            >
              Super Ü Mart is a dedicated wholesale supplier serving businesses,
              retailers, and bulk buyers across the region. We focus on reliable
              supply, competitive pricing, and long-term partnerships.
            </p>

            {/* Mission & Vision */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 40,
                marginBottom: 60,
              }}
            >
              <div
                style={{
                  background: "white",
                  padding: 30,
                  borderRadius: 16,
                  boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
                }}
              >
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: DARK_BLUE,
                    marginBottom: 15,
                  }}
                >
                  Our Mission
                </h3>

                <p style={{ color: "#555", lineHeight: 1.6 }}>
                  To empower businesses and consumers by sourcing, distributing, and retailing high-quality products efficiently, 
                  ensuring maximum value, exceptional service, and sustainable growth for our partners and customers
                </p>
              </div>

              <div
                style={{
                  background: "white",
                  padding: 30,
                  borderRadius: 16,
                  boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
                }}
              >
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: DARK_BLUE,
                    marginBottom: 15,
                  }}
                >
                  Our Vision
                </h3>

                <p style={{ color: "#555", lineHeight: 1.6 }}>
                  To be the most trusted retailer, where people love to work and shop. 
                  We'll do this by putting our customers at the heart of everything we do and investing in our stores,
                  our colleagues and our channels to offer the best possible shopping experience.
                </p>
              </div>
            </div>

            {/* Why Choose Us */}
            <div
              style={{
                background: "white",
                padding: 40,
                borderRadius: 16,
                boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
              }}
            >
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: DARK_BLUE,
                  marginBottom: 25,
                }}
              >
                Why Businesses Choose Us
              </h3>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 15,
                }}
              >
                <li style={bulletStyle}>
                  ✔ Competitive wholesale pricing
                </li>
                <li style={bulletStyle}>
                  ✔ Reliable stock availability
                </li>
                <li style={bulletStyle}>
                  ✔ Efficient order processing
                </li>
                <li style={bulletStyle}>
                  ✔ Dedicated support for registered businesses
                </li>
              </ul>

              <p style={{ marginTop: 30, color: "#666" }}>
                We operate strictly as a wholesale supplier. Registration and
                company verification may be required before account approval.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

const bulletStyle: React.CSSProperties = {
  background: "#f9fafb",
  padding: "14px 18px",
  borderRadius: 8,
  borderLeft: "4px solid #f97316",
  fontWeight: 500,
};