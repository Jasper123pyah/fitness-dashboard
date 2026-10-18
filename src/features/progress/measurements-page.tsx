import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Plus, Ruler, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { ProgressLineChart } from "@/components/shared/line-chart";
import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteMeasurement,
  listMeasurements,
  saveMeasurement,
} from "@/db/repo/progress";
import type { MeasurementType } from "@/db/types";
import { formatLongDate, todayKey } from "@/lib/dates";
import { MEASUREMENT_TYPE_LABELS, MEASUREMENT_TYPE_ORDER } from "@/lib/labels";
import { formatNumber, formatSignedNumber } from "@/lib/units";
import { cn } from "@/lib/utils";

export function MeasurementsPage() {
  const measurements = useLiveQuery(() => listMeasurements(), []);
  const [type, setType] = useState<MeasurementType>("WAIST");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    date: todayKey(),
    value: "",
    type: "WAIST" as MeasurementType,
  });

  const forType = useMemo(
    () => (measurements ?? []).filter((item) => item.type === type),
    [measurements, type],
  );

  if (measurements === undefined) return <PageSkeleton />;

  const first = forType[0];
  const last = forType[forType.length - 1];
  const change =
    first && last && first.id !== last.id ? last.valueCm - first.valueCm : null;

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
        title="Metingen"
        description="Omtrekken zeggen bij recompositie vaak meer dan het gewicht alleen."
        action={
          <Button
            size="sm"
            onClick={() => {
              setDraft({ date: todayKey(), value: "", type });
              setOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Meting
          </Button>
        }
      />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {MEASUREMENT_TYPE_ORDER.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              type === option
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {MEASUREMENT_TYPE_LABELS[option]}
          </button>
        ))}
      </div>

      {forType.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title={`Nog geen meting van ${MEASUREMENT_TYPE_LABELS[type].toLowerCase()}`}
          description="Meet op een vast moment, bijvoorbeeld 's ochtends voor het ontbijt."
          action={
            <Button
              onClick={() => {
                setDraft({ date: todayKey(), value: "", type });
                setOpen(true);
              }}
            >
              Meting invoeren
            </Button>
          }
        />
      ) : (
        <>
          <section className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {MEASUREMENT_TYPE_LABELS[type]}
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  {last ? `${formatNumber(last.valueCm)} cm` : "—"}
                </p>
              </div>
              {change != null ? (
                <p
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    change < 0
                      ? "text-success"
                      : change > 0
                        ? "text-warning"
                        : "text-muted-foreground",
                  )}
                >
                  {formatSignedNumber(change)} cm sinds de eerste meting
                </p>
              ) : null}
            </div>

            <ProgressLineChart
              data={forType.map((item) => ({
                date: item.date,
                value: item.valueCm,
              }))}
              unit="cm"
              valueLabel={MEASUREMENT_TYPE_LABELS[type]}
            />
          </section>

          <ul className="divide-y rounded-xl border bg-card">
            {[...forType].reverse().map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">
                  {formatLongDate(item.date)}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatNumber(item.valueCm)} cm
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Meting verwijderen"
                  className="text-muted-foreground"
                  onClick={async () => {
                    await deleteMeasurement(item.id);
                    toast.success("Meting verwijderd");
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Meting invoeren</DialogTitle>
            <DialogDescription>
              Eén meting per lichaamsdeel per dag.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Wat</Label>
              <Select
                items={MEASUREMENT_TYPE_LABELS}
                value={draft.type}
                onValueChange={(value) =>
                  setDraft({
                    ...draft,
                    type: (value as MeasurementType) ?? "WAIST",
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEASUREMENT_TYPE_ORDER.map((option) => (
                    <SelectItem key={option} value={option}>
                      {MEASUREMENT_TYPE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="measurement-date">Datum</Label>
              <Input
                id="measurement-date"
                type="date"
                className="h-11"
                max={todayKey()}
                value={draft.date}
                onChange={(event) =>
                  setDraft({ ...draft, date: event.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="measurement-value">Omtrek (cm)</Label>
              <Input
                id="measurement-value"
                inputMode="decimal"
                className="h-11 text-lg"
                value={draft.value}
                onChange={(event) =>
                  setDraft({ ...draft, value: event.target.value })
                }
                placeholder="82,5"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
            <Button
              onClick={async () => {
                const parsed = Number(draft.value.replace(",", ".").trim());
                if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 300) {
                  toast.error("Vul een omtrek in tussen 1 en 300 cm");
                  return;
                }
                await saveMeasurement({
                  date: draft.date,
                  type: draft.type,
                  valueCm: Math.round(parsed * 10) / 10,
                });
                setType(draft.type);
                setOpen(false);
                toast.success("Meting opgeslagen");
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
