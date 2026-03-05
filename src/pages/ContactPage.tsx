import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ContactPage() {
  const DARK_BLUE = "#111d5e";
  const ACCENT_ORANGE = "#f97316";

  return (
    <>
      <Header />

      <div
        style={{
          minHeight: "90vh",
          position: "relative",
          backgroundImage: "url('/categories/warehouse-bg.png')", // ✅ correct for /public
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Blue overlay (same tone as home) */}
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
            <h1
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "white",
                marginBottom: 10,
              }}
            >
              Contact Super Ü Mart
            </h1>

            <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 40 }}>
              Wholesale enquiries, bulk pricing questions, or partnership discussions.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 40,
              }}
            >
              {/* Company Info */}
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
                    marginBottom: 20,
                    color: DARK_BLUE,
                  }}
                >
                  Company Details
                </h3>

                <p>
                  <strong>Phone:</strong> 084 988 8800
                </p>
                <p>
                  <strong>Email:</strong> superumart.web@gmail.com
                </p>
                <p>
                  <strong>Location:</strong> Vereeniging Industrial Area
                </p>
                <div style={{ lineHeight: 1.8 }}>
                  <p><strong>Hours:</strong> </p>
                  <p>Monday–Friday | 07:00 – 17:00</p>
                  <p>Saturday | 08:00 – 14:00</p>
                  <p>Sunday/ Public Holidays | 08:00 – 14:00</p>
                </div>

                <p style={{ marginTop: 20, color: "#666" }}>
                  We operate strictly as a wholesale supplier. Business registration details may be
                  required.
                </p>
              </div>

              {/* Contact Form */}
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
                    marginBottom: 20,
                    color: DARK_BLUE,
                  }}
                >
                  Send Us a Message
                </h3>

                <form
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 15,
                  }}
                >
                  <input type="text" placeholder="Company Name" required style={inputStyle} />
                  <input type="text" placeholder="Contact Person" required style={inputStyle} />
                  <input type="email" placeholder="Email Address" required style={inputStyle} />
                  <textarea
                    placeholder="Your Message"
                    rows={5}
                    required
                    style={{ ...inputStyle, resize: "none" }}
                  />

                  <button
                    type="submit"
                    style={{
                      background: ACCENT_ORANGE,
                      color: "white",
                      border: "none",
                      padding: "12px",
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: 10,
                    }}
                  >
                    Send Enquiry
                  </button>
                </form>
              </div>
            </div>
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