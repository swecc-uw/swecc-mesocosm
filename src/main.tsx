import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AuthProvider } from "@/hooks/useAuth";

const el = document.getElementById("root");
if (!el) {
  throw new Error("#root missing");
}

const app = (
  <AuthProvider>
    <App />
  </AuthProvider>
);
const wrapped = import.meta.env.DEV ? <StrictMode>{app}</StrictMode> : app;

try {
  createRoot(el).render(wrapped);
} catch (e) {
  el.innerHTML =
    "<pre style=\"padding:1rem;font:14px/1.4 monospace;background:#fee;color:#400\">" +
    String(e) +
    "</pre>";
}
