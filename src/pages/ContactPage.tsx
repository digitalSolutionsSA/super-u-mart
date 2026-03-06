import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ContactPage() {
  const DARK_BLUE = "#111d5e";
  const ACCENT_ORANGE = "#f97316";

  const whatsappNumber = "27849888800";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const companyName = String(formData.get("companyName") || "");
    const contactPerson = String(formData.get("contactPerson") || "");
    const email = String(formData.get("email") || "");
    const message = String(formData.get("message") || "");

    const whatsappMessage = encodeURIComponent(
`Hello Super Ü Mart,

Company Name: ${companyName || "N/A"}
Contact Person: ${contactPerson}
Email: ${email}

Message:
${message}`
    );

    window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, "_blank");
  };

  return (
    <>
      <Header />

      <div
        style={{
          minHeight: "90vh",
          position: "relative",
          backgroundImage: "url('/categories/warehouse-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Blue overlay */}
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
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 40,
              }}
            >
              {/* Company Details */}
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
                  <strong>Location:</strong> 17a Telford Street, Duncanville, Vereeniging
                </p>

                <div style={{ lineHeight: 1.8 }}>
                  <p><strong>Hours:</strong></p>
                  <p>Monday–Friday | 07:30 – 17:30</p>
                  <p>Saturday | 07:30 – 15:00</p>
                  <p>Sunday / Public Holidays | 07:30 – 14:00</p>
                </div>

                <p style={{ marginTop: 20, color: "#666" }}>
                  We are open to the public. Resellers are welcome to apply for a cash-on-delivery account for easier ordering.
                </p>

                {/* Google Maps */}
                <div style={{ marginTop: 25 }}>
                  <iframe
                    title="Super U Mart Location"
                    src="https://www.google.com/maps?q=14+Telford+St,+Duncanville,+Vereeniging,+1939&z=15&output=embed"
                    width="100%"
                    height="220"
                    style={{
                      border: 0,
                      borderRadius: 10,
                    }}
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
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
                  onSubmit={handleSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 15,
                  }}
                >
                  {/* OPTIONAL */}
                  <input
                    name="companyName"
                    type="text"
                    placeholder="Company Name (optional)"
                    style={inputStyle}
                  />

                  <input
                    name="contactPerson"
                    type="text"
                    placeholder="Contact Person"
                    required
                    style={inputStyle}
                  />

                  <input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    required
                    style={inputStyle}
                  />

                  <textarea
                    name="message"
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