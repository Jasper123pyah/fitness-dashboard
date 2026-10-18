import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import { createExercise, updateExercise } from "@/db/repo/exercises";
import type { Exercise } from "@/db/types";
import { EQUIPMENT, EXERCISE_CATEGORIES, MUSCLE_GROUPS } from "@/db/types";
import {
  EQUIPMENT_LABELS,
  EQUIPMENT_ORDER,
  EXERCISE_CATEGORY_LABELS,
  EXERCISE_CATEGORY_ORDER,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_ORDER,
} from "@/lib/labels";

const schema = z.object({
  name: z.string().trim().min(2, "Geef een naam van minstens twee tekens."),
  primaryMuscle: z.enum(MUSCLE_GROUPS),
  equipment: z.enum(EQUIPMENT),
  category: z.enum(EXERCISE_CATEGORIES),
  instructions: z.string().trim().max(1000).optional(),
  supportsOneRepMax: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function ExerciseFormDialog({
  open,
  onOpenChange,
  exercise,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: Exercise;
  onSaved?: (name: string) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      primaryMuscle: "CHEST",
      equipment: "MACHINE",
      category: "COMPOUND",
      instructions: "",
      supportsOneRepMax: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      exercise
        ? {
            name: exercise.name,
            primaryMuscle: exercise.primaryMuscle,
            equipment: exercise.equipment,
            category: exercise.category,
            instructions: exercise.instructions ?? "",
            supportsOneRepMax: exercise.supportsOneRepMax,
          }
        : {
            name: "",
            primaryMuscle: "CHEST",
            equipment: "MACHINE",
            category: "COMPOUND",
            instructions: "",
            supportsOneRepMax: true,
          },
    );
  }, [open, exercise, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        instructions: values.instructions?.trim()
          ? values.instructions.trim()
          : undefined,
        secondaryMuscles: exercise?.secondaryMuscles ?? [],
      };

      if (exercise) {
        await updateExercise(exercise.id, payload);
      } else {
        await createExercise(payload);
      }
      onSaved?.(values.name);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error && error.name === "ConstraintError"
          ? "Er bestaat al een oefening met deze naam."
          : "Opslaan lukte niet.";
      toast.error(message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {exercise ? "Oefening aanpassen" : "Nieuwe oefening"}
          </DialogTitle>
          <DialogDescription>
            Deze oefening komt in je eigen bibliotheek en kun je aan elk schema
            toevoegen.
          </DialogDescription>
        </DialogHeader>

        <form
          id="exercise-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="exercise-name">Naam</Label>
            <Input
              id="exercise-name"
              {...form.register("name")}
              className="h-11"
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Spiergroep</Label>
              <Select
                items={MUSCLE_GROUP_LABELS}
                value={form.watch("primaryMuscle")}
                onValueChange={(value) =>
                  form.setValue(
                    "primaryMuscle",
                    value as FormValues["primaryMuscle"],
                  )
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUP_ORDER.map((group) => (
                    <SelectItem key={group} value={group}>
                      {MUSCLE_GROUP_LABELS[group]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Materiaal</Label>
              <Select
                items={EQUIPMENT_LABELS}
                value={form.watch("equipment")}
                onValueChange={(value) =>
                  form.setValue("equipment", value as FormValues["equipment"])
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_ORDER.map((item) => (
                    <SelectItem key={item} value={item}>
                      {EQUIPMENT_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Soort</Label>
            <Select
              items={EXERCISE_CATEGORY_LABELS}
              value={form.watch("category")}
              onValueChange={(value) =>
                form.setValue("category", value as FormValues["category"])
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXERCISE_CATEGORY_ORDER.map((item) => (
                  <SelectItem key={item} value={item}>
                    {EXERCISE_CATEGORY_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exercise-instructions">
              Uitvoering (optioneel)
            </Label>
            <Textarea
              id="exercise-instructions"
              rows={3}
              {...form.register("instructions")}
              placeholder="Waar let je op bij deze oefening?"
            />
          </div>

          <label className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
              checked={form.watch("supportsOneRepMax")}
              onCheckedChange={(checked) =>
                form.setValue("supportsOneRepMax", checked === true)
              }
            />
            <span className="text-sm">
              Geschatte 1RM bijhouden
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Alleen zinvol bij oefeningen met een duidelijke externe
                belasting, zoals bankdrukken of de leg press.
              </span>
            </span>
          </label>
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
          <Button
            type="submit"
            form="exercise-form"
            disabled={form.formState.isSubmitting}
          >
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
