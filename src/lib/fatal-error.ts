/**
 * Toont het foutscherm uit index.html met de echte foutmelding, in plaats van
 * een leeg scherm na een crash.
 */
export function reportFatalError(error: unknown, componentStack?: string | null) {
  console.error(error);
  const withStack =
    error instanceof Error && componentStack
      ? Object.assign(new Error(error.message), {
          name: error.name,
          stack: `${error.stack ?? ""}\n\nComponent:${componentStack}`,
        })
      : error;
  if (window.__trainlogFatal) {
    window.__trainlogFatal(withStack);
  } else {
    // Vangnet ontbreekt (bijvoorbeeld in tests): toon in elk geval iets.
    document.body.textContent = `Trainlog kon niet starten: ${String(error)}`;
  }
}
