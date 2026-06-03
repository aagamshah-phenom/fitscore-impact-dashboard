import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { DemoStateProvider } from "./state/DemoState";

// Note: StrictMode is intentionally not used. Radix UI's `asChild` slot pattern
// has a known infinite-render bug under React 19 + StrictMode that crashes the
// Compare/Prioritize/Keep-warm dialogs. Disabling StrictMode is the documented
// workaround until @radix-ui/react-slot ships the memoized SlotClone fix.
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <DemoStateProvider>
      <App />
    </DemoStateProvider>
  </BrowserRouter>,
);
