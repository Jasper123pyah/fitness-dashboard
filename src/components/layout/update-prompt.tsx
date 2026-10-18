import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setupServiceWorker } from "@/pwa";

/**
 * Melding dat er een nieuwe versie klaarstaat. De gebruiker kiest zelf wanneer
 * die wordt geladen; de opgeslagen gegevens blijven ongemoeid.
 *
 * Meldt ook eenmalig dat de app offline klaar is, of dat dat is mislukt.
 */
export function UpdatePrompt() {
  const [reload, setReload] = useState<(() => Promise<void>) | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setupServiceWorker({
      onNeedRefresh: (doReload) => setReload(() => doReload),
      onOfflineReady: () => {
        toast.success("Klaar voor offlinegebruik", {
          description: "De app opent nu ook zonder internet.",
        });
      },
      onError: (message) => {
        toast.error("Offlinegebruik is niet gelukt", {
          description: `${message} Open de app opnieuw met internet.`,
        });
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
