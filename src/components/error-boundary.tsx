import { Component, type ErrorInfo, type ReactNode } from "react";

import { reportFatalError } from "@/lib/fatal-error";

/**
 * Vangt een crash tijdens het tekenen. Zonder deze grens ontkoppelt React de
 * hele boom en blijft er een leeg scherm over. Het foutscherm zelf staat in
 * index.html, buiten React, zodat het ook werkt als de app half kapot is.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportFatalError(error, info.componentStack);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
