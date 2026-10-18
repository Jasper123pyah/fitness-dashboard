import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, CalendarDays, History, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { deleteSession, listSessionSummaries } from "@/db/repo/workouts";
import { formatDuration, formatLongDate } from "@/lib/dates";

export function HistoryPage() {
  const sessions = useLiveQuery(() => listSessionSummaries(), []);

  if (sessions === undefined) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <Button
        nativeButton={false}
        render={<Link to="/training" />}
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Training
      </Button>

      <PageHeader
        title="Historie"
        description={`${sessions.length} trainingen vastgelegd`}
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nog geen trainingen"
          description="Zodra je een training afrondt, verschijnt die hier."
        />
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center gap-2 rounded-xl border bg-card p-3"
            >
              <Link
                to={`/training/sessie/${session.id}`}
                className="min-w-0 flex-1"
              >
                <p className="flex items-center gap-2 font-medium">
                  <span className="truncate">{session.name}</span>
                  {session.status === "IN_PROGRESS" ? (
                    <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      loopt
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden />
                  {formatLongDate(session.date)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  {session.exerciseCount} oefeningen · {session.setCount} sets ·{" "}
                  {session.volumeKg} kg
                  {session.completedAt
                    ? ` · ${formatDuration(new Date(session.startedAt), new Date(session.completedAt))}`
                    : ""}
                </p>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${session.name} verwijderen`}
                className="text-muted-foreground"
                onClick={async () => {
                  await deleteSession(session.id);
                  toast.success("Training verwijderd");
                }}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
