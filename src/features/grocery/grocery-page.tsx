import { useLiveQuery } from "dexie-react-hooks";
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  MoreVertical,
  Plus,
  RefreshCw,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { GroceryItemRow } from "./grocery-item-row";
import { EmptyState } from "@/components/shared/empty-state";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  addCustomGroceryItem,
  clearCheckedItems,
  generateGroceryList,
  getGroceryList,
  setAllChecked,
} from "@/db/repo/grocery";
import type { ShoppingCategory, Unit } from "@/db/types";
import {
  SHOPPING_CATEGORY_LABELS,
  SHOPPING_CATEGORY_ORDER,
  UNIT_LABELS,
  UNIT_LABELS_LONG,
  UNIT_LABELS_WITH_NONE,
  UNIT_ORDER,
} from "@/lib/labels";
import {
  addDaysToKey,
  formatWeekRange,
  isoWeekNumber,
  startOfWeekKey,
  todayKey,
  type DateKey,
} from "@/lib/dates";
import { formatQuantity } from "@/lib/units";

export function GroceryPage() {
  const [weekStart, setWeekStart] = useState<DateKey>(() =>
    startOfWeekKey(todayKey()),
  );
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<{
    name: string;
    quantity: string;
    unit: Unit | "NONE";
    category: ShoppingCategory;
  }>({ name: "", quantity: "", unit: "NONE", category: "OTHER" });

  const list = useLiveQuery(() => getGroceryList(weekStart), [weekStart]);

  if (list === undefined) return <PageSkeleton />;

  const items = list?.items ?? [];
  const checkedCount = items.filter((item) => item.checked).length;

  async function regenerate() {
    await generateGroceryList(weekStart);
    toast.success("Lijst bijgewerkt", {
      description: "Zelf toegevoegde en aangepaste regels zijn blijven staan.",
    });
  }

  function copyToClipboard() {
    const grouped = SHOPPING_CATEGORY_ORDER.map((category) => {
      const lines = items
        .filter((item) => item.category === category)
        .map((item) => {
          const quantity =
            item.quantity != null && item.unit
              ? ` — ${formatQuantity(item.quantity)} ${UNIT_LABELS[item.unit]}`
              : "";
          return `${item.checked ? "x" : "-"} ${item.name}${quantity}`;
        });
      return lines.length > 0
        ? `${SHOPPING_CATEGORY_LABELS[category]}:\n${lines.join("\n")}`
        : null;
    })
      .filter((block): block is string => block != null)
      .join("\n\n");

    const text = `Boodschappen week ${isoWeekNumber(weekStart)} (${formatWeekRange(weekStart)})\n\n${grouped}`;
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Lijst gekopieerd"))
      .catch(() => toast.error("Kopiëren lukte niet"));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Boodschappen"
        description={`Week ${isoWeekNumber(weekStart)} · ${formatWeekRange(weekStart)}`}
        action={
          <Button variant="outline" size="sm" onClick={() => void regenerate()}>
            <RefreshCw className="size-4" aria-hidden />
            Bijwerken
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Vorige week"
          onClick={() => setWeekStart(addDaysToKey(weekStart, -7))}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => setWeekStart(startOfWeekKey(todayKey()))}
        >
          Deze week
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="Opties voor de lijst"
              >
                <MoreVertical className="size-4" aria-hidden />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={copyToClipboard}>
              <ClipboardCopy className="size-4" aria-hidden />
              Lijst kopiëren
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!list}
              onClick={async () => {
                if (list) await setAllChecked(list.id, false);
              }}
            >
              <CheckCheck className="size-4" aria-hidden />
              Alle vinkjes wissen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={!list || checkedCount === 0}
              onClick={async () => {
                if (!list) return;
                await clearCheckedItems(list.id);
                toast.success("Afgevinkte regels verwijderd");
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              Afgevinkte verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="icon"
          aria-label="Volgende week"
          onClick={() => setWeekStart(addDaysToKey(weekStart, 7))}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      {!list || items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Nog geen boodschappenlijst"
          description="De lijst wordt gemaakt uit het weekmenu: alle ingrediënten bij elkaar opgeteld."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => void regenerate()}>
                <RefreshCw className="size-4" aria-hidden />
                Lijst maken
              </Button>
              <Button
                nativeButton={false}
                render={<Link to="/voeding/planner" />}
                variant="outline"
              >
                Naar het weekmenu
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            <span className="text-muted-foreground tabular-nums">
              {checkedCount} van {items.length} afgevinkt
            </span>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Item
            </Button>
          </div>

          <div className="space-y-4">
            {SHOPPING_CATEGORY_ORDER.map((category) => {
              const categoryItems = items.filter(
                (item) => item.category === category,
              );
              if (categoryItems.length === 0) return null;

              return (
                <section key={category}>
                  <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {SHOPPING_CATEGORY_LABELS[category]}
                  </h2>
                  <ul className="divide-y rounded-xl border bg-card">
                    {categoryItems.map((item) => (
                      <li key={item.id}>
                        <GroceryItemRow item={item} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Item toevoegen</DialogTitle>
            <DialogDescription>
              Zelf toegevoegde items blijven staan als je de lijst opnieuw laat
              maken.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="grocery-name">Wat</Label>
              <Input
                id="grocery-name"
                className="h-11"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                placeholder="Afwasmiddel"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="grocery-quantity">Hoeveelheid</Label>
                <Input
                  id="grocery-quantity"
                  type="number"
                  inputMode="decimal"
                  className="h-11"
                  value={draft.quantity}
                  onChange={(event) =>
                    setDraft({ ...draft, quantity: event.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Eenheid</Label>
                <Select
                  items={UNIT_LABELS_WITH_NONE}
                  value={draft.unit}
                  onValueChange={(value) =>
                    setDraft({
                      ...draft,
                      unit: (value as Unit | "NONE") ?? "NONE",
                    })
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Geen</SelectItem>
                    {UNIT_ORDER.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {UNIT_LABELS_LONG[unit]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Schap</Label>
              <Select
                items={SHOPPING_CATEGORY_LABELS}
                value={draft.category}
                onValueChange={(value) =>
                  setDraft({
                    ...draft,
                    category: (value as ShoppingCategory) ?? "OTHER",
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHOPPING_CATEGORY_ORDER.map((category) => (
                    <SelectItem key={category} value={category}>
                      {SHOPPING_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
            <Button
              disabled={draft.name.trim().length === 0}
              onClick={async () => {
                let listId = list?.id;
                if (!listId) {
                  const created = await generateGroceryList(weekStart);
                  listId = created.id;
                }
                const quantity = draft.quantity.replace(",", ".").trim();
                await addCustomGroceryItem({
                  listId,
                  name: draft.name,
                  quantity: quantity === "" ? null : Number(quantity),
                  unit: draft.unit === "NONE" ? null : draft.unit,
                  category: draft.category,
                });
                setDraft({
                  name: "",
                  quantity: "",
                  unit: "NONE",
                  category: "OTHER",
                });
                setAddOpen(false);
              }}
            >
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
