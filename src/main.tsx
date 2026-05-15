import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-recover from stale dynamic-import chunks after a new deployment.
const RELOAD_KEY = "__chunk_reload__";
const isChunkLoadError = (msg?: string) =>
  !!msg && /dynamically imported module|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg);

window.addEventListener("error", (e) => {
  if (isChunkLoadError(e.message) && !sessionStorage.getItem(RELOAD_KEY)) {
    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
  }
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = (e.reason && (e.reason.message || String(e.reason))) || "";
  if (isChunkLoadError(msg) && !sessionStorage.getItem(RELOAD_KEY)) {
    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
  }
});
window.addEventListener("load", () => sessionStorage.removeItem(RELOAD_KEY));

createRoot(document.getElementById("root")!).render(<App />);
