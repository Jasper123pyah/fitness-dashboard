import { useLiveQuery } from "dexie-react-hooks";
import {
  Camera,
  ChevronRight,
  Images,
  Ruler,
  Scale,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/shared/empty-state";
import { ProgressLineChart } from "@/components/shared/line-chart";
import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { Stat } from "@/components/shared/stat";
import { Button } from "@/components/ui/button";
import {
  listMeasurements,
  listPhotos,
  listWeightEntries,
} from "@/db/repo/progress";
import { listRecentRecords } from "@/db/repo/workouts";
import { useSettings } from "@/hooks/use-settings";
import { formatShortDate } from "@/lib/dates";
import { MEASUREMENT_TYPE_LABELS } from "@/lib/labels";
import { formatNumber, formatQuantity, formatSignedNumber } from "@/lib/units";
import { movingAverage, weightSummary } from "@/lib/weight";

export function ProgressPage() {
  const entries = useLiveQuery(() => listWeightEntries(), []);
  const measurements = useLiveQuery(() => listMeasurements(), []);
  const photos = useLiveQuery(() => listPhotos(), []);
  const records = useLiveQuery(() => listRecentRecords(5), []);
  const settings = useSettings();

  if (
    entries === undefined ||
    measurements === undefined ||
    settings === undefined
  ) {
    return <PageSkeleton />;
  }

  const summary = weightSummary(entries, {
    startWeightKg: settings.startWeightKg,
  });
  const chart = movingAverage(entries, 7).map((point) => ({
    date: point.date,
    value: point.weightKg,
    secondary: point.average,
  }));
  const waist = measurements.filter((item) => item.type === "WAIST");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Voortgang"
        description="Gewicht, omtrek, foto's en records."
      />

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Gewicht</h2>
          <Button
            nativeButton={false}
            render={<Link to="/voortgang/gewicht" />}
            variant="ghost"
            size="sm"
          >
            Bijhouden
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Nog geen wegingen"
            description="Voer je eerste weging in om je verloop te zien."
            action={
              <Button
                nativeButton={false}
                render={<Link to="/voortgang/gewicht" />}
              >
                Weging invoeren
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="Laatste"
                value={
                  summary.latest
                    ? `${formatNumber(summary.latest.weightKg)} kg`
                    : "—"
                }
                hint={
                  summary.latest
                    ? formatShortDate(summary.latest.date)
                    : undefined
                }
              />
              <Stat
                label="Week"
                value={
                  summary.currentWeekAverage != null
                    ? `${formatNumber(summary.currentWeekAverage)} kg`
                    : "—"
                }
                hint={`${summary.currentWeekCount} metingen`}
              />
              <Stat
                label="Verschil"
                value={
                  summary.weeklyChange != null
                    ? `${formatSignedNumber(summary.weeklyChange)} kg`
                    : "—"
                }
                tone={
                  summary.weeklyChange == null
                    ? "muted"
                    : summary.weeklyChange > 0
                      ? "negative"
                      : "positive"
                }
                hint="t.o.v. vorige week"
              />
            </div>
            <div className="mt-3">
              <ProgressLineChart
                data={chart}
                unit="kg"
                height={180}
                valueLabel="Weging"
                secondaryLabel="Gemiddelde (7 dagen)"
              />
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Taille</h2>
          <Button
            nativeButton={false}
            render={<Link to="/voortgang/metingen" />}
            variant="ghost"
            size="sm"
          >
            Metingen
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        {waist.length === 0 ? (
          <EmptyState
            icon={Ruler}
            title="Nog geen tailleomtrek"
            description="Bij recompositie zegt de taille vaak meer dan de weegschaal."
            action={
              <Button
                nativeButton={false}
                render={<Link to="/voortgang/metingen" />}
              >
                Meting invoeren
              </Button>
            }
          />
        ) : (
          <>
            <p className="text-2xl font-semibold tabular-nums">
              {formatNumber(waist[waist.length - 1].valueCm)} cm
            </p>
            <p className="text-xs text-muted-foreground">
              {MEASUREMENT_TYPE_LABELS.WAIST} op{" "}
              {formatShortDate(waist[waist.length - 1].date)}
            </p>
            <div className="mt-3">
              <ProgressLineChart
                data={waist.map((item) => ({
                  date: item.date,
                  value: item.valueCm,
                }))}
                unit="cm"
                height={160}
                valueLabel="Taille"
              />
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Trophy className="size-4 text-primary" aria-hidden />
            Records
          </h2>
        </div>

        {!records || records.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rond een training af om hier je zwaarste sets te zien.
          </p>
        ) : (
          <ul className="divide-y">
            {records.map((record) => (
              <li key={record.exerciseId}>
                <Link
                  to={`/training/oefeningen/${record.exerciseId}`}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {record.exerciseName}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatQuantity(record.weightKg)} kg × {record.reps} ·{" "}
                      {formatShortDate(record.date)}
                      {record.estimatedOneRepMax != null
                        ? ` · 1RM ≈ ${formatQuantity(record.estimatedOneRepMax)} kg`
                        : ""}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button
        nativeButton={false}
        render={<Link to="/voortgang/fotos" />}
        variant="outline"
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          {photos && photos.length > 0 ? (
            <Images className="size-4" aria-hidden />
          ) : (
            <Camera className="size-4" aria-hidden />
          )}
          Voortgangsfoto's
          {photos && photos.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              ({photos.length})
            </span>
          ) : null}
        </span>
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
