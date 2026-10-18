import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, CalendarCheck, Layers, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  applyTemplateToWeek,
  deleteTemplate,
  deleteTemplateItem,
  listTemplates,
  updateTemplate,
} from "@/db/repo/mealPlan";
import {
  addDaysToKey,
  formatWeekRange,
  startOfWeekKey,
  todayKey,
  WEEKDAY_NAMES,
} from "@/lib/dates";
import { MEAL_CATEGORY_LABELS } from "@/lib/labels";

export function TemplatesPage() {
  const templates = useLiveQuery(() => listTemplates(), []);
  const [applyFor, setApplyFor] = useState<string | null>(null);
  const [editFor, setEditFor] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [targetWeek, setTargetWeek] = useState(() =>
    startOfWeekKey(todayKey()),
  );
  const [replaceExisting, setReplaceExisting] = useState(true);

  if (templates === undefined) return <PageSkeleton />;

  const weekOptions = Array.from({ length: 6 }, (_, index) =>
    addDaysToKey(startOfWeekKey(todayKey()), index * 7),
  );
  const weekLabels = Object.fromEntries(
    weekOptions.map((week, index) => [
      week,
      `${index === 0 ? "Deze week" : `Over ${index} week`} · ${formatWeekRange(week)}`,
    ]),
  );

  return (
    <div className="space-y-4">
      <Button
        nativeButton={false}
        render={<Link to="/voeding/planner" />}
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Weekmenu
      </Button>

      <PageHeader
        title="Sjablonen"
        description="Vaste weekmenu's die je op elke week kunt zetten."
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Nog geen sjablonen"
          description="Plan een week en sla die op als sjabloon."
          action={
            <Button
              nativeButton={false}
              render={<Link to="/voeding/planner" />}
            >
              Naar het weekmenu
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {templates.map((template) => (
            <li key={template.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold">{template.name}</h2>
                  {template.description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.items.length} maaltijden
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`${template.name} hernoemen`}
                    onClick={() =>
                      setEditFor({
                        id: template.id,
                        name: template.name,
                        description: template.description ?? "",
                      })
                    }
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${template.name} verwijderen`}
                    className="text-muted-foreground"
                    onClick={async () => {
                      await deleteTemplate(template.id);
                      toast.success("Sjabloon verwijderd");
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>

              <ul className="mt-3 space-y-1">
                {template.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-foreground">
                        {WEEKDAY_NAMES[item.weekday - 1].slice(0, 2)}
                      </span>{" "}
                      {MEAL_CATEGORY_LABELS[item.slot]} ·{" "}
                      {item.recipe?.name ?? "recept verwijderd"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Regel verwijderen"
                      onClick={() => void deleteTemplateItem(item.id)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-3 w-full"
                onClick={() => setApplyFor(template.id)}
              >
                <CalendarCheck className="size-4" aria-hidden />
                Op een week zetten
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={applyFor != null}
        onOpenChange={(open) => {
          if (!open) setApplyFor(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sjabloon toepassen</DialogTitle>
            <DialogDescription>
              Kies op welke week dit menu moet komen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Week</Label>
              <Select
                items={weekLabels}
                value={targetWeek}
                onValueChange={(value) =>
                  setTargetWeek(value ?? startOfWeekKey(todayKey()))
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map((week, index) => (
                    <SelectItem key={week} value={week}>
                      {index === 0 ? "Deze week" : `Over ${index} week`} ·{" "}
                      {formatWeekRange(week)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                checked={replaceExisting}
                onCheckedChange={(checked) =>
                  setReplaceExisting(checked === true)
                }
              />
              <span className="text-sm">
                Bestaande maaltijden vervangen
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Uit staat het sjabloon alleen de lege plekken in.
                </span>
              </span>
            </label>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
            <Button
              onClick={async () => {
                if (!applyFor) return;
                await applyTemplateToWeek(applyFor, targetWeek, {
                  replaceExisting,
                });
                setApplyFor(null);
                toast.success("Sjabloon toegepast");
              }}
            >
              Toepassen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editFor != null}
        onOpenChange={(open) => {
          if (!open) setEditFor(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sjabloon hernoemen</DialogTitle>
            <DialogDescription>
              Pas de naam of de omschrijving aan.
            </DialogDescription>
          </DialogHeader>

          {editFor ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="template-edit-name">Naam</Label>
                <Input
                  id="template-edit-name"
                  className="h-11"
                  value={editFor.name}
                  onChange={(event) =>
                    setEditFor({ ...editFor, name: event.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="template-edit-description">Omschrijving</Label>
                <Input
                  id="template-edit-description"
                  className="h-11"
                  value={editFor.description}
                  onChange={(event) =>
                    setEditFor({ ...editFor, description: event.target.value })
                  }
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
            <Button
              onClick={async () => {
                if (!editFor) return;
                await updateTemplate(editFor.id, {
                  name: editFor.name.trim(),
                  description: editFor.description.trim() || undefined,
                });
                setEditFor(null);
                toast.success("Sjabloon bijgewerkt");
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
