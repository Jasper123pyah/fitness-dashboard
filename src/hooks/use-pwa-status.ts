import { useSyncExternalStore } from "react";

import { getPwaStatus, subscribePwaStatus, type PwaStatus } from "@/pwa";

export function usePwaStatus(): PwaStatus {
  return useSyncExternalStore(subscribePwaStatus, getPwaStatus);
}
