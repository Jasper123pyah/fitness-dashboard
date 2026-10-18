import { AlertTriangle, Dumbbell } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { db } from "@/db/db";
import { seedDatabase } from "@/db/seed";
import { getSettings } from "@/db/repo/settings";
import { applyTheme } from "@/lib/theme";
import { requestPersistentStorage } from "@/pwa";

type BootState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

/**
 * Opent de database, zet bij de eerste start de standaardinhoud klaar en vraagt
 * de browser om de opslag te bewaren. Pas daarna wordt de app getoond, zodat
 * geen enkel scherm met een halve database begint.
 */
export function AppBoot({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BootState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await db.open();
        await seedDatabase();

        // Het thema uit de instellingen volgen; localStorage heeft al voor de
        // eerste weergave gezorgd, dit houdt beide gelijk.
        const settings = await getSettings();
        const stored = localStorage.getItem("trainlog.theme");
        if (stored !== settings.theme) {
          localStorage.setItem("trainlog.theme", settings.theme);
          applyTheme(settings.theme);
        }

        void requestPersistentStorage();
        if (!cancelled) setState({ status: "ready" });
      } catch (error) {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "De lokale database kon niet worden geopend.",
        });
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-muted-foreground">
        <Dumbbell className="size-7 animate-pulse" aria-hidden />
        <p className="text-sm">Even klaarzetten…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle className="size-8 text-destructive" aria-hidden />
        <div>
          <p className="font-medium">De app kon niet starten</p>
          <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Dit gebeurt bijvoorbeeld in een privévenster, waar de browser geen
            lokale opslag toestaat. Open de app in een gewoon venster.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
