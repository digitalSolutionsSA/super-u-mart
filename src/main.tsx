import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

import { AdminAuthProvider } from "./context/AdminAuthContext";
import { StoreProvider } from "./context/StoreContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);