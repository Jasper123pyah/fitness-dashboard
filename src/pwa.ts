import { registerSW } from "virtual:pwa-register";

/**
 * Of de app zonder internet kan openen. Pas "ready" als de service worker
 * aantoonbaar is geïnstalleerd: een geïnstalleerde app (beginscherm) zegt
 * daar op zich niets over.
 */
export type OfflineStatus =
  | { state: "unsupported" }
  | { state: "disabled" }
  | { state: "installing" }
  | { state: "ready" }
  | { state: "error"; message: string };

/**
 * Of de browser heeft toegezegd de opslag te bewaren. Dat besluit de browser
 * zelf op basis van eigen regels; de app kan er alleen om vragen.
 */
export type StorageStatus =
  | "checking"
  | "persisted"
  | "not-persisted"
  | "unsupported";

export interface PwaStatus {
  offline: OfflineStatus;
  storage: StorageStatus;
}

function initialOfflineStatus(): OfflineStatus {
  if (import.meta.env.DEV) return { state: "disabled" };
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return { state: "unsupported" };
  }
  return { state: "installing" };
}

let status: PwaStatus = {
  offline: initialOfflineStatus(),
  storage: "checking",
};
const listeners = new Set<() => void>();

function setStatus(patch: Partial<PwaStatus>): void {
  status = { ...status, ...patch };
  for (const listener of listeners) listener();
}

export function getPwaStatus(): PwaStatus {
  return status;
}

export function subscribePwaStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "De service worker kon niet worden geregistreerd.";
}

/** Volgt een service worker die nog installeert tot hij actief of mislukt is. */
function watchInstall(registration: ServiceWorkerRegistration): void {
  const worker = registration.installing ?? registration.waiting;
  if (!worker) return;
  worker.addEventListener("statechange", () => {
    if (worker.state === "activated" || worker.state === "installed") {
      if (registration.active) setStatus({ offline: { state: "ready" } });
    }
    // "redundant" zonder actieve voorganger: het precachen is mislukt en er
    // staat niets in de cache om offline mee te openen.
    if (worker.state === "redundant" && !registration.active) {
      setStatus({
        offline: {
          state: "error",
          message:
            "De bestanden voor offlinegebruik konden niet worden opgeslagen.",
        },
      });
    }
  });
}

let registered = false;

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
  onError: (message: string) => void;
}): void {
  if (registered || status.offline.state !== "installing") return;
  registered = true;

  const unsubscribe = subscribePwaStatus(() => {
    if (status.offline.state === "error") {
      handlers.onError(status.offline.message);
      unsubscribe();
    }
  });

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      handlers.onNeedRefresh(async () => {
        await updateServiceWorker(true);
      });
    },
    onOfflineReady() {
      setStatus({ offline: { state: "ready" } });
      handlers.onOfflineReady();
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Bij een volgend bezoek staat de cache er al; onOfflineReady komt dan
      // niet meer.
      if (registration.active) {
        setStatus({ offline: { state: "ready" } });
      } else {
        watchInstall(registration);
      }
    },
    onRegisterError(error: unknown) {
      setStatus({ offline: { state: "error", message: errorMessage(error) } });
    },
  });
}

/**
 * Vraagt de browser om de opslag te bewaren. Zonder dit mag iOS de database
 * opruimen als er ruimte nodig is, en dan zijn de trainingen weg. De browser
 * kan weigeren; de uitkomst staat daarna in getPwaStatus().storage.
 */
export async function requestPersistentStorage(): Promise<StorageStatus> {
  let result: StorageStatus;
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    result = "unsupported";
  } else {
    try {
      result =
        (await navigator.storage.persisted()) ||
        (await navigator.storage.persist())
          ? "persisted"
          : "not-persisted";
    } catch {
      result = "not-persisted";
    }
  }
  setStatus({ storage: result });
  return result;
}

export function isStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return (
    "standalone" in navigator &&
    Boolean((navigator as { standalone?: boolean }).standalone)
  );
}
