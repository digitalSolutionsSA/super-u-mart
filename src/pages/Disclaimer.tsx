import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Disclaimer() {
  return (
    <>
      <Header />

      <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px" }}>
        <h1 style={{ fontSize: 32, marginBottom: 20 }}>Disclaimer</h1>

        <p>
          Welcome to Super U Mart. By using this website, you agree to the
          following terms and conditions. Please read them carefully.
        </p>

        <h2>1. General Information</h2>
        <p>
          All products and information provided on this website are for general
          informational and commercial purposes only. While we strive for
          accuracy, we make no guarantees regarding completeness, reliability,
          or accuracy of product descriptions, pricing, or availability.
        </p>

        <h2>2. Product Use</h2>
        <p>
          Customers are responsible for ensuring that any products purchased are
          suitable for their intended use. Super U Mart will not be held liable
          for misuse of products or any damages resulting from improper use.
        </p>

        <h2>3. Pricing & Availability</h2>
        <p>
          Prices and product availability are subject to change without notice.
          We reserve the right to cancel or refuse any order for any reason,
          including errors in pricing or stock levels.
        </p>

        <h2>4. Payments</h2>
        <p>
          All payments are processed securely via third-party payment providers.
          We do not store your card details. Super U Mart is not responsible for
          any issues arising from third-party payment services.
        </p>

        <h2>5. Shipping & Delivery</h2>
        <p>
          Delivery times are estimates and may vary. We are not responsible for
          delays caused by couriers or external factors beyond our control.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          Super U Mart shall not be held liable for any direct, indirect,
          incidental, or consequential damages arising from the use of this
          website or products purchased through it.
        </p>

        <h2>7. Changes</h2>
        <p>
          We reserve the right to update or change this disclaimer at any time
          without prior notice.
        </p>

        <p style={{ marginTop: 30, fontSize: 14, opacity: 0.7 }}>
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Footer />
    </>
  );
}