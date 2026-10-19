import { useEffect, useState } from "react";

import { todayKey, type DateKey } from "@/lib/dates";

/**
 * De datum van vandaag, die meeloopt als de dag verandert. Een app op het
 * beginscherm wordt door iOS hervat in plaats van opnieuw geladen; zonder dit
 * bleef na middernacht (of op maandag: een nieuwe week) de vorige dag staan.
 */
export function useToday(): DateKey {
  const [today, setToday] = useState(() => todayKey());

  useEffect(() => {
    const refresh = () => setToday(todayKey());

    // Net na middernacht opnieuw kijken, zolang de app open blijft.
    let timer = 0;
    const scheduleMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 5, 0);
      timer = window.setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, midnight.getTime() - now.getTime());
    };
    scheduleMidnight();

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return today;
}
