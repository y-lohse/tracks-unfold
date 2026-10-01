import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "@fontsource-variable/geist-mono";

import { App } from "./App";
import "./index.css";

registerSW({
  onRegisterError(error: unknown) {
    console.warn("Offline setup failed. Reload online to retry.", error);
  },
});

const root = document.querySelector("#root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
