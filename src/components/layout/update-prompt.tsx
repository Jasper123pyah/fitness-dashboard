import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { setupServiceWorker } from "@/pwa";

/**
 * Melding dat er een nieuwe versie klaarstaat. De gebruiker kiest zelf wanneer
 * die wordt geladen; de opgeslagen gegevens blijven ongemoeid.
 */
export function UpdatePrompt() {
  const [reload, setReload] = useState<(() => Promise<void>) | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setupServiceWorker({
      onNeedRefresh: (doReload) => setReload(() => doReload),
      onOfflineReady: () => {
        // Niets te melden: offline werken is hier het uitgangspunt.
      },
    });
  }, []);

  if (!reload) return null;

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-16 z-50 px-4 md:bottom-6">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-lg">
        <div className="min-w-0">
          <p className="text-sm font-medium">Nieuwe versie beschikbaar</p>
          <p className="text-xs text-muted-foreground">
            Je gegevens blijven staan bij het bijwerken.
          </p>
        </div>
        <Button
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await reload();
          }}
        >
          <RefreshCw className="size-4" aria-hidden />
          Bijwerken
        </Button>
      </div>
    </div>
  );
}
