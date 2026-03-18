import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WebApp from "@twa-dev/sdk";
import "./index.css";
import App from "./App";

try {
  WebApp.ready();
  WebApp.expand();
} catch {
  /* вне Telegram */
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
