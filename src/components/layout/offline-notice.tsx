import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * De app werkt offline, dus "geen verbinding" is geen storing. Er wordt alleen
 * kort gemeld dat je offline bent, zodat je weet dat dat klopt.
 */
export function OfflineNotice() {
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const online = () => setOffline(false);
    const went = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", went);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", went);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
      <WifiOff className="size-4 shrink-0" aria-hidden />
      Offline. Alles werkt gewoon, je gegevens staan op dit toestel.
    </div>
  );
}
