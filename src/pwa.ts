import { registerSW } from "virtual:pwa-register";

/**
 * Registreert de service worker. Die zorgt dat de app na de eerste keer
 * installeren zonder internet opent.
 *
 * Een update wordt nooit stil doorgevoerd: de gebruiker krijgt het te zien en
 * beslist zelf. Updaten raakt de gegevens niet, want die staan in IndexedDB en
 * niet in de cache van de service worker.
 */
export function setupServiceWorker(handlers: {
  onNeedRefresh: (reload: () => Promise<void>) => void;
  onOfflineReady: () => void;
}): void {
  if (import.meta.env.DEV) return;

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      handlers.onNeedRefresh(async () => {
        await updateServiceWorker(true);
      });
    },
    onOfflineReady() {
      handlers.onOfflineReady();
    },
  });
}

/**
 * Vraagt de browser om de opslag te bewaren. Zonder dit mag iOS de database
 * opruimen als er ruimte nodig is, en dan zijn de trainingen weg.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export function isStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return (
    "standalone" in navigator &&
    Boolean((navigator as { standalone?: boolean }).standalone)
  );
}
