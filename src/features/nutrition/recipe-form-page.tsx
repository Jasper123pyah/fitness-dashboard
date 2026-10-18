import { zodResolver } from "@hookform/resolvers/zod";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  createRecipe,
  getRecipeWithIngredients,
  updateRecipe,
} from "@/db/repo/recipes";
import { MEAL_CATEGORIES, SHOPPING_CATEGORIES, UNITS } from "@/db/types";
import {
  MEAL_CATEGORY_LABELS,
  MEAL_CATEGORY_ORDER,
  SHOPPING_CATEGORY_LABELS,
  SHOPPING_CATEGORY_ORDER,
  UNIT_LABELS_LONG,
  UNIT_ORDER,
} from "@/lib/labels";

const schema = z.object({
  name: z.string().trim().min(2, "Geef het recept een naam."),
  description: z.string().trim().max(400).optional(),
  category: z.enum(MEAL_CATEGORIES),
  prepMinutes: z.coerce.number().int().min(1, "Minimaal 1 minuut.").max(600),
  servings: z.coerce.number().min(0.5, "Minimaal een halve portie.").max(20),
  isVegetarian: z.boolean(),
  instructions: z.string().trim().min(5, "Schrijf hoe je het maakt."),
  kcalPerServing: z.coerce
    .number()
    .min(0)
    .max(5000)
    .optional()
    .or(z.literal("")),
  proteinPerServing: z.coerce
    .number()
    .min(0)
    .max(500)
    .optional()
    .or(z.literal("")),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Naam ontbreekt."),
        quantity: z.coerce
          .number()
          .positive("Hoeveelheid moet groter dan nul zijn."),
        unit: z.enum(UNITS),
        category: z.enum(SHOPPING_CATEGORIES),
        note: z.string().trim().max(120).optional(),
      }),
    )
    .min(1, "Voeg minstens één ingrediënt toe."),
});

type FormValues = z.input<typeof schema>;
type ParsedValues = z.output<typeof schema>;

const EMPTY_INGREDIENT = {
  name: "",
  quantity: 100,
  unit: "GRAM" as const,
  category: "OTHER" as const,
  note: "",
};

export function RecipeFormPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const existing = useLiveQuery(
    () =>
      recipeId ? getRecipeWithIngredients(recipeId) : Promise.resolve(null),
    [recipeId],
  );

  const form = useForm<FormValues, unknown, ParsedValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      category: "DINNER",
      prepMinutes: 20,
      servings: 2,
      isVegetarian: true,
      instructions: "",
      kcalPerServing: "",
      proteinPerServing: "",
      ingredients: [EMPTY_INGREDIENT],
    },
  });

  const ingredients = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  useEffect(() => {
    if (!recipeId || !existing) return;
    form.reset({
      name: existing.name,
      description: existing.description ?? "",
      category: existing.category,
      prepMinutes: existing.prepMinutes,
      servings: existing.servings,
      isVegetarian: existing.isVegetarian,
      instructions: existing.instructions,
      kcalPerServing: existing.kcalPerServing ?? "",
      proteinPerServing: existing.proteinPerServing ?? "",
      ingredients: existing.ingredients.map((item) => ({
        name: item.ingredient.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.ingredient.category,
        note: item.note ?? "",
      })),
    });
  }, [recipeId, existing, form]);

  if (recipeId && existing === undefined) return <PageSkeleton />;

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      category: values.category,
      instructions: values.instructions,
      prepMinutes: values.prepMinutes,
      servings: values.servings,
      isVegetarian: values.isVegetarian,
      kcalPerServing:
        typeof values.kcalPerServing === "number"
          ? values.kcalPerServing
          : undefined,
      proteinPerServing:
        typeof values.proteinPerServing === "number"
          ? values.proteinPerServing
          : undefined,
      ingredients: values.ingredients.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        note: item.note || undefined,
      })),
    };

    try {
      if (recipeId) {
        await updateRecipe(recipeId, payload);
        toast.success("Recept bijgewerkt");
        navigate(`/voeding/recept/${recipeId}`);
      } else {
        const id = await createRecipe(payload);
        toast.success("Recept toegevoegd");
        navigate(`/voeding/recept/${id}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error && error.name === "ConstraintError"
          ? "Er bestaat al een recept met deze naam."
          : "Opslaan lukte niet.",
      );
    }
  });

  return (
    <div className="space-y-5">
      <Button
        nativeButton={false}
        render={
          <Link to={recipeId ? `/voeding/recept/${recipeId}` : "/voeding"} />
        }
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Terug
      </Button>

      <PageHeader title={recipeId ? "Recept aanpassen" : "Nieuw recept"} />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
        className="space-y-5"
      >
        <section className="space-y-4 rounded-xl border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="recipe-name">Naam</Label>
            <Input
              id="recipe-name"
              className="h-11"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recipe-description">Korte omschrijving</Label>
            <Input
              id="recipe-description"
              className="h-11"
              {...form.register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Moment</Label>
              <Select
                items={MEAL_CATEGORY_LABELS}
                value={form.watch("category")}
                onValueChange={(value) =>
                  form.setValue(
                    "category",
                    (value as FormValues["category"]) ?? "DINNER",
                  )
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_CATEGORY_ORDER.map((item) => (
                    <SelectItem key={item} value={item}>
                      {MEAL_CATEGORY_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipe-prep">Bereidingstijd (min)</Label>
              <Input
                id="recipe-prep"
                type="number"
                inputMode="numeric"
                className="h-11"
                {...form.register("prepMinutes")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="recipe-servings">Porties</Label>
              <Input
                id="recipe-servings"
                type="number"
                inputMode="decimal"
                step="0.5"
                className="h-11"
                {...form.register("servings")}
              />
              {form.formState.errors.servings ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.servings.message}
                </p>
              ) : null}
            </div>

            <label className="flex items-center gap-3 self-end rounded-lg border p-3">
              <Checkbox
                checked={form.watch("isVegetarian")}
                onCheckedChange={(checked) =>
                  form.setValue("isVegetarian", checked === true)
                }
              />
              <span className="text-sm">Vegetarisch</span>
            </label>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Ingrediënten</h2>
              <p className="text-xs text-muted-foreground">
                Hoeveelheid en eenheid zijn nodig voor de boodschappenlijst.
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {ingredients.fields.map((field, index) => (
              <li key={field.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <GripVertical
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    className="h-11"
                    placeholder="Ingrediënt"
                    aria-label={`Naam ingrediënt ${index + 1}`}
                    {...form.register(`ingredients.${index}.name` as const)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Ingrediënt ${index + 1} verwijderen`}
                    className="text-muted-foreground"
                    onClick={() => ingredients.remove(index)}
                    disabled={ingredients.fields.length === 1}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>

                <div className="mt-2 grid grid-cols-[5rem_1fr_1fr] gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    className="h-11"
                    aria-label={`Hoeveelheid ingrediënt ${index + 1}`}
                    {...form.register(`ingredients.${index}.quantity` as const)}
                  />
                  <Select
                    items={UNIT_LABELS_LONG}
                    value={form.watch(`ingredients.${index}.unit` as const)}
                    onValueChange={(value) =>
                      form.setValue(
                        `ingredients.${index}.unit` as const,
                        (value as FormValues["ingredients"][number]["unit"]) ??
                          "GRAM",
                      )
                    }
                  >
                    <SelectTrigger
                      className="h-11"
                      aria-label={`Eenheid ingrediënt ${index + 1}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_ORDER.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {UNIT_LABELS_LONG[unit]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    items={SHOPPING_CATEGORY_LABELS}
                    value={form.watch(`ingredients.${index}.category` as const)}
                    onValueChange={(value) =>
                      form.setValue(
                        `ingredients.${index}.category` as const,
                        (value as FormValues["ingredients"][number]["category"]) ??
                          "OTHER",
                      )
                    }
                  >
                    <SelectTrigger
                      className="h-11"
                      aria-label={`Schap ingrediënt ${index + 1}`}
                    >
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

                {form.formState.errors.ingredients?.[index] ? (
                  <p className="mt-1.5 text-xs text-destructive">
                    {form.formState.errors.ingredients[index]?.name?.message ??
                      form.formState.errors.ingredients[index]?.quantity
                        ?.message}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => ingredients.append(EMPTY_INGREDIENT)}
          >
            <Plus className="size-4" aria-hidden />
            Ingrediënt toevoegen
          </Button>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="recipe-instructions">Bereiding</Label>
            <Textarea
              id="recipe-instructions"
              rows={8}
              placeholder={"1. Kook de rijst.\n2. Bak de tofu."}
              {...form.register("instructions")}
            />
            {form.formState.errors.instructions ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.instructions.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="recipe-kcal">Kcal per portie (optioneel)</Label>
              <Input
                id="recipe-kcal"
                type="number"
                inputMode="numeric"
                className="h-11"
                {...form.register("kcalPerServing")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recipe-protein">
                Eiwit per portie (optioneel)
              </Label>
              <Input
                id="recipe-protein"
                type="number"
                inputMode="decimal"
                className="h-11"
                {...form.register("proteinPerServing")}
              />
            </div>
          </div>
        </section>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          Recept opslaan
        </Button>
      </form>
    </div>
  );
}
