import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { applyTheme, readStoredTheme } from "./lib/theme";
import "./index.css";

// Het thema nog voor de eerste render toepassen, zodat er geen witte flits is.
applyTheme(readStoredTheme());

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
