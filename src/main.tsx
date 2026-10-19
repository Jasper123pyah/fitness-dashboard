import "./polyfills";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { ErrorBoundary } from "./components/error-boundary";
import { reportFatalError } from "./lib/fatal-error";
import { applyTheme, readStoredTheme } from "./lib/theme";
import "./index.css";

window.__TRAINLOG_BUILD__ = __APP_BUILD__;

// Het thema nog voor de eerste render toepassen, zodat er geen witte flits is.
applyTheme(readStoredTheme());

createRoot(document.getElementById("root") as HTMLElement, {
  // Fouten die de ErrorBoundary niet vangt, laten anders een leeg scherm achter.
  onUncaughtError: (error, info) =>
    reportFatalError(error, info.componentStack),
}).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
