import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db/db";
import { formatLongDate, todayKey } from "@/lib/dates";

/** Laat zien hoeveel er in de app staat en wanneer de laatste back-up was. */
export function BackupSummary({
  lastBackupAt,
}: {
  lastBackupAt: string | null;
}) {
  const counts = useLiveQuery(async () => {
    const [sessions, recipes, weights, photos] = await Promise.all([
      db.sessions.count(),
      db.recipes.count(),
      db.weightEntries.count(),
      db.progressPhotos.count(),
    ]);
    return { sessions, recipes, weights, photos };
  }, []);

  if (!counts) return null;

  return (
    <dl className="grid grid-cols-4 gap-2 rounded-lg bg-muted/50 p-3 text-center">
      {[
        { label: "Trainingen", value: counts.sessions },
        { label: "Recepten", value: counts.recipes },
        { label: "Wegingen", value: counts.weights },
        { label: "Foto's", value: counts.photos },
      ].map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] text-muted-foreground">{item.label}</dt>
          <dd className="font-semibold tabular-nums">{item.value}</dd>
        </div>
      ))}
      <div className="col-span-4 border-t pt-2 text-xs text-muted-foreground">
        {lastBackupAt
          ? `Laatste back-up: ${formatLongDate(todayKey(new Date(lastBackupAt)))}`
          : "Nog geen back-up gemaakt"}
      </div>
    </dl>
  );
}
