import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Plus, Scale, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { ProgressLineChart } from "@/components/shared/line-chart";
import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { Stat } from "@/components/shared/stat";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteWeightEntry,
  listWeightEntries,
  saveWeightEntry,
} from "@/db/repo/progress";
import { useSettings } from "@/hooks/use-settings";
import { formatLongDate, formatWeekRange, todayKey } from "@/lib/dates";
import { formatNumber, formatSignedNumber } from "@/lib/units";
import { movingAverage, weeklyAverages, weightSummary } from "@/lib/weight";

export function WeightPage() {
  const entries = useLiveQuery(() => listWeightEntries(), []);
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => todayKey());
  const [weight, setWeight] = useState("");

  if (entries === undefined || settings === undefined) return <PageSkeleton />;

  const summary = weightSummary(entries, {
    startWeightKg: settings.startWeightKg,
  });
  const averages = weeklyAverages(entries);
  const chart = movingAverage(entries, 7).map((point) => ({
    date: point.date,
    value: point.weightKg,
    secondary: point.average,
  }));

  return (
    <div className="space-y-5">
      <Button
        nativeButton={false}
        render={<Link to="/voortgang" />}
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voortgang
      </Button>

      <PageHeader
        title="Gewicht"
        description={`${entries.length} wegingen`}
        action={
          <Button
            size="sm"
            onClick={() => {
              setDate(todayKey());
              setWeight(
                summary.latest
                  ? String(summary.latest.weightKg).replace(".", ",")
                  : "",
              );
              setOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Weging
          </Button>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="Nog geen wegingen"
          description="Weeg jezelf een paar keer per week, het liefst op hetzelfde moment van de dag."
          action={
            <Button onClick={() => setOpen(true)}>
              Eerste weging invoeren
            </Button>
          }
        />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-4">
            <Stat
              label="Laatste"
              value={
                summary.latest
                  ? `${formatNumber(summary.latest.weightKg)} kg`
                  : "—"
              }
              hint={
                summary.latest ? formatLongDate(summary.latest.date) : undefined
              }
            />
            <Stat
              label="Deze week"
              value={
                summary.currentWeekAverage != null
                  ? `${formatNumber(summary.currentWeekAverage)} kg`
                  : "—"
              }
              hint={
                summary.currentWeekCount > 0
                  ? `${summary.currentWeekCount} ${summary.currentWeekCount === 1 ? "meting" : "metingen"}`
                  : "nog geen meting"
              }
            />
            <Stat
              label="Vorige week"
              value={
                summary.previousWeekAverage != null
                  ? `${formatNumber(summary.previousWeekAverage)} kg`
                  : "—"
              }
              hint={
                summary.previousWeekCount > 0
                  ? `${summary.previousWeekCount} ${summary.previousWeekCount === 1 ? "meting" : "metingen"}`
                  : "geen meting"
              }
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
              hint="week op week"
            />
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Verloop</h2>
            <ProgressLineChart
              data={chart}
              unit="kg"
              height={220}
              valueLabel="Weging"
              secondaryLabel="Gemiddelde (7 dagen)"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              De streepjeslijn is het gemiddelde over zeven dagen. Dagen zonder
              weging tellen niet mee.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Weekgemiddelden
            </h2>
            <ul className="divide-y rounded-xl border bg-card">
              {[...averages].reverse().map((week) => (
                <li
                  key={week.weekStart}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate">
                      {formatWeekRange(week.weekStart)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {week.count} {week.count === 1 ? "meting" : "metingen"}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatNumber(week.average)} kg
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Alle wegingen
            </h2>
            <ul className="divide-y rounded-xl border bg-card">
              {[...entries].reverse().map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {formatLongDate(entry.date)}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatNumber(entry.weightKg)} kg
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Weging van ${formatLongDate(entry.date)} verwijderen`}
                    className="text-muted-foreground"
                    onClick={async () => {
                      await deleteWeightEntry(entry.id);
                      toast.success("Weging verwijderd");
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Weging invoeren</DialogTitle>
            <DialogDescription>
              Eén weging per dag. Voer je op dezelfde dag nog eens in, dan wordt
              die overschreven.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="weight-date">Datum</Label>
              <Input
                id="weight-date"
                type="date"
                className="h-11"
                value={date}
                max={todayKey()}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight-value">Gewicht (kg)</Label>
              <Input
                id="weight-value"
                inputMode="decimal"
                className="h-11 text-lg"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder="75,4"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
            <Button
              onClick={async () => {
                const parsed = Number(weight.replace(",", ".").trim());
                if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 400) {
                  toast.error("Vul een gewicht in tussen 1 en 400 kg");
                  return;
                }
                await saveWeightEntry({
                  date,
                  weightKg: Math.round(parsed * 10) / 10,
                });
                setOpen(false);
                toast.success("Weging opgeslagen");
              }}
            >
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
