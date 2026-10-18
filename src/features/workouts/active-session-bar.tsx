import { useLiveQuery } from "dexie-react-hooks";
import { Timer } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getActiveSession } from "@/db/repo/workouts";
import { formatRelativeDay } from "@/lib/dates";

/** Herinnering bovenaan het scherm dat er nog een training openstaat. */
export function ActiveSessionBar() {
  const session = useLiveQuery(() => getActiveSession(), []);
  const location = useLocation();

  if (!session) return null;
  if (location.pathname === `/training/sessie/${session.id}`) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Timer className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {session.name} loopt nog
          </p>
          <p className="text-xs text-muted-foreground">
            Gestart {formatRelativeDay(session.date).toLowerCase()}
          </p>
        </div>
      </div>
      <Button
        nativeButton={false}
        render={<Link to={`/training/sessie/${session.id}`} />}
        size="sm"
      >
        Doorgaan
      </Button>
    </div>
  );
}
