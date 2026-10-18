import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteGroceryItem,
  toggleGroceryItem,
  updateGroceryItem,
} from "@/db/repo/grocery";
import type { GroceryItem, Unit } from "@/db/types";
import {
  UNIT_LABELS,
  UNIT_LABELS_LONG,
  UNIT_LABELS_WITH_NONE,
  UNIT_ORDER,
} from "@/lib/labels";
import { formatQuantity } from "@/lib/units";
import { cn } from "@/lib/utils";

export function GroceryItemRow({ item }: { item: GroceryItem }) {
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(
    item.quantity == null ? "" : String(item.quantity).replace(".", ","),
  );
  const [unit, setUnit] = useState<Unit | "NONE">(item.unit ?? "NONE");

  if (editing) {
    return (
      <div className="space-y-2 p-3">
        <p className="text-sm font-medium">{item.name}</p>
        <div className="flex gap-2">
          <Input
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            inputMode="decimal"
            aria-label={`Hoeveelheid voor ${item.name}`}
            className="h-11 w-24"
          />
          <Select
            items={UNIT_LABELS_WITH_NONE}
            value={unit}
            onValueChange={(value) =>
              setUnit((value as Unit | "NONE") ?? "NONE")
            }
          >
            <SelectTrigger
              className="h-11 flex-1"
              aria-label={`Eenheid voor ${item.name}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Geen</SelectItem>
              {UNIT_ORDER.map((option) => (
                <SelectItem key={option} value={option}>
                  {UNIT_LABELS_LONG[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={async () => {
              const parsed = quantity.replace(",", ".").trim();
              await updateGroceryItem(item.id, {
                quantity: parsed === "" ? null : Number(parsed),
                unit: unit === "NONE" ? null : unit,
              });
              setEditing(false);
            }}
          >
            Opslaan
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Annuleren
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Checkbox
        checked={item.checked}
        onCheckedChange={() => void toggleGroceryItem(item.id)}
        aria-label={`${item.name} afvinken`}
        className="size-5"
      />

      <button
        type="button"
        onClick={() => void toggleGroceryItem(item.id)}
        className="min-w-0 flex-1 text-left"
      >
        <span
          className={cn(
            "block truncate text-sm font-medium transition-colors",
            item.checked && "text-muted-foreground line-through",
          )}
        >
          {item.name}
        </span>
        <span className="block text-xs text-muted-foreground tabular-nums">
          {item.quantity != null && item.unit
            ? `${formatQuantity(item.quantity)} ${UNIT_LABELS[item.unit]}`
            : item.quantity != null
              ? formatQuantity(item.quantity)
              : "—"}
          {item.isCustom
            ? " · zelf toegevoegd"
            : item.isEdited
              ? " · aangepast"
              : ""}
        </span>
      </button>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`${item.name} aanpassen`}
        className="text-muted-foreground"
        onClick={() => setEditing(true)}
      >
        <Pencil className="size-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`${item.name} verwijderen`}
        className="text-muted-foreground"
        onClick={() => void deleteGroceryItem(item.id)}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
