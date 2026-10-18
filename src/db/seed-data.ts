/**
 * Standaardinhoud waarmee de app na de installatie direct bruikbaar is:
 * een oefeningenbibliotheek, het vaste trainingsschema, ingrediënten en
 * recepten met echte hoeveelheden en bereidingen.
 *
 * Alle id's zijn leesbare slugs. Daardoor is het seeden herhaalbaar en kunnen
 * recepten en het weekmenu naar elkaar verwijzen zonder zoekwerk.
 */

import type {
  Equipment,
  Exercise,
  ExerciseCategory,
  Ingredient,
  MealCategory,
  MuscleGroup,
  Recipe,
  ShoppingCategory,
  Unit,
} from "./types";

export const SEED_VERSION = 1;

// ------------------------------------------------------------------ oefeningen

type ExerciseSeed = Omit<Exercise, "createdAt" | "updatedAt" | "isCustom"> & {
  isCustom?: boolean;
};

function exercise(
  id: string,
  name: string,
  primaryMuscle: MuscleGroup,
  secondaryMuscles: MuscleGroup[],
  equipment: Equipment,
  category: ExerciseCategory,
  supportsOneRepMax: boolean,
  instructions?: string,
): ExerciseSeed {
  return {
    id,
    name,
    primaryMuscle,
    secondaryMuscles,
    equipment,
    category,
    supportsOneRepMax,
    instructions,
  };
}

export const SEED_EXERCISES: ExerciseSeed[] = [
  // Push
  exercise(
    "ex-bankdrukken",
    "Bankdrukken",
    "CHEST",
    ["TRICEPS", "SHOULDERS"],
    "BARBELL",
    "COMPOUND",
    true,
    "Schouderbladen naar achteren en omlaag, voeten stevig op de vloer. Laat de stang gecontroleerd tot net boven het onderste deel van de borst zakken en druk hem in een rechte lijn terug.",
  ),
  exercise(
    "ex-schuine-dumbbell-press",
    "Schuine dumbbell press",
    "CHEST",
    ["SHOULDERS", "TRICEPS"],
    "DUMBBELL",
    "COMPOUND",
    true,
    "Bank op ongeveer 30 graden. Dumbbells op schouderbreedte, ellebogen onder een hoek van ongeveer 45 graden ten opzichte van het lichaam.",
  ),
  exercise(
    "ex-schouderpers",
    "Schouderpers",
    "SHOULDERS",
    ["TRICEPS"],
    "MACHINE",
    "COMPOUND",
    true,
    "Rug tegen de steun, grip net buiten schouderbreedte. Druk omhoog zonder de ellebogen volledig te blokkeren.",
  ),
  exercise(
    "ex-laterale-raises",
    "Laterale raises",
    "SHOULDERS",
    [],
    "DUMBBELL",
    "ISOLATION",
    false,
    "Lichte voorwaartse buiging, ellebogen licht gebogen. Breng de dumbbells tot schouderhoogte en laat ze langzaam zakken.",
  ),
  exercise(
    "ex-triceps-pushdown",
    "Triceps pushdown",
    "TRICEPS",
    [],
    "CABLE",
    "ISOLATION",
    false,
    "Ellebogen langs het lichaam houden en alleen de onderarm bewegen.",
  ),

  // Pull
  exercise(
    "ex-lat-pulldown",
    "Lat pulldown",
    "LATS",
    ["BICEPS", "UPPER_BACK"],
    "CABLE",
    "COMPOUND",
    true,
    "Grip iets buiten schouderbreedte. Trek de stang naar de bovenkant van de borst en laat de ellebogen langs het lichaam zakken.",
  ),
  exercise(
    "ex-chest-supported-row",
    "Chest-supported row",
    "UPPER_BACK",
    ["LATS", "BICEPS"],
    "MACHINE",
    "COMPOUND",
    true,
    "Borst tegen het kussen, trek de grepen naar je toe en knijp de schouderbladen samen zonder met de romp mee te bewegen.",
  ),
  exercise(
    "ex-kabelroei-zittend",
    "Kabelroei (zittend)",
    "UPPER_BACK",
    ["LATS", "BICEPS"],
    "CABLE",
    "COMPOUND",
    true,
    "Rechte rug, trek de greep naar de navel en laat de romp stil.",
  ),
  exercise(
    "ex-reverse-pec-deck",
    "Reverse pec deck",
    "UPPER_BACK",
    ["SHOULDERS"],
    "MACHINE",
    "ISOLATION",
    false,
    "Armen bijna gestrekt, beweeg vanuit de schouders naar achteren.",
  ),
  exercise(
    "ex-bicepscurl",
    "Bicepscurl",
    "BICEPS",
    ["FOREARMS"],
    "DUMBBELL",
    "ISOLATION",
    false,
    "Ellebogen op hun plek houden en de dumbbells gecontroleerd laten zakken.",
  ),
  exercise(
    "ex-kabel-crunch",
    "Kabel crunch",
    "CORE",
    [],
    "CABLE",
    "CORE",
    false,
    "Knielend, handen bij het hoofd. Rol de rug op vanuit de buik, niet trekken met de armen.",
  ),

  // Legs
  exercise(
    "ex-leg-extension",
    "Leg extension",
    "QUADS",
    [],
    "MACHINE",
    "ISOLATION",
    false,
    "Rustig tempo, bovenaan kort vasthouden. Een goede eerste oefening om de benen op te warmen.",
  ),
  exercise(
    "ex-seated-leg-curl",
    "Seated leg curl",
    "HAMSTRINGS",
    ["CALVES"],
    "MACHINE",
    "ISOLATION",
    false,
    "Knieën in lijn met het draaipunt van de machine, gecontroleerd terug laten komen.",
  ),
  exercise(
    "ex-leg-press",
    "Leg press",
    "QUADS",
    ["HAMSTRINGS", "GLUTES", "CALVES"],
    "MACHINE",
    "COMPOUND",
    true,
    "Voeten op schouderbreedte, knieën tot ongeveer 90 graden. Rustig ademen tussen de reps; dit is de oefening waarbij misselijkheid het snelst opkomt, dus houd het tempo beheerst.",
  ),
  exercise(
    "ex-kuitverhogingen",
    "Kuitverhogingen",
    "CALVES",
    [],
    "MACHINE",
    "ISOLATION",
    false,
    "Volledige strekking boven, kort pauzeren onderaan.",
  ),
  exercise(
    "ex-hangende-knieheffing",
    "Hangende knieheffing",
    "CORE",
    [],
    "BODYWEIGHT",
    "CORE",
    false,
    "Hang stil aan de stang en breng de knieën richting de borst zonder te zwaaien.",
  ),

  // Upper
  exercise(
    "ex-schuine-chest-press",
    "Schuine chest press",
    "CHEST",
    ["SHOULDERS", "TRICEPS"],
    "MACHINE",
    "COMPOUND",
    true,
    "Handgrepen op borsthoogte, druk weg zonder de ellebogen te blokkeren.",
  ),
  exercise(
    "ex-cable-fly",
    "Cable fly",
    "CHEST",
    [],
    "CABLE",
    "ISOLATION",
    false,
    "Lichte buiging in de ellebogen, breng de handen voor de borst samen.",
  ),
  exercise(
    "ex-triceps-extensie",
    "Triceps extensie",
    "TRICEPS",
    [],
    "CABLE",
    "ISOLATION",
    false,
    "Boven het hoofd of met een touw; houd de ellebogen dicht bij elkaar.",
  ),

  // Rest van de bibliotheek
  exercise(
    "ex-pull-up",
    "Pull-up",
    "LATS",
    ["BICEPS", "UPPER_BACK"],
    "BODYWEIGHT",
    "COMPOUND",
    true,
  ),
  exercise(
    "ex-assisted-pull-up",
    "Assisted pull-up",
    "LATS",
    ["BICEPS", "UPPER_BACK"],
    "MACHINE",
    "COMPOUND",
    true,
  ),
  exercise(
    "ex-push-up",
    "Push-up",
    "CHEST",
    ["TRICEPS", "CORE"],
    "BODYWEIGHT",
    "COMPOUND",
    false,
  ),
  exercise(
    "ex-dumbbell-row",
    "Dumbbell row",
    "UPPER_BACK",
    ["LATS", "BICEPS"],
    "DUMBBELL",
    "COMPOUND",
    true,
  ),
  exercise(
    "ex-face-pull",
    "Face pull",
    "UPPER_BACK",
    ["SHOULDERS"],
    "CABLE",
    "ISOLATION",
    false,
  ),
  exercise(
    "ex-hammer-curl",
    "Hamercurl",
    "BICEPS",
    ["FOREARMS"],
    "DUMBBELL",
    "ISOLATION",
    false,
  ),
  exercise(
    "ex-skullcrusher",
    "Skullcrusher",
    "TRICEPS",
    [],
    "DUMBBELL",
    "ISOLATION",
    false,
  ),
  exercise(
    "ex-dumbbell-shoulder-press",
    "Dumbbell schouderpers",
    "SHOULDERS",
    ["TRICEPS"],
    "DUMBBELL",
    "COMPOUND",
    true,
  ),
  exercise(
    "ex-shrug",
    "Shrug",
    "UPPER_BACK",
    [],
    "DUMBBELL",
    "ISOLATION",
    false,
  ),
  exercise(
    "ex-goblet-squat",
    "Goblet squat",
    "QUADS",
    ["GLUTES", "CORE"],
    "DUMBBELL",
    "COMPOUND",
    true,
  ),
  exercise(
    "ex-romanian-deadlift",
    "Romanian deadlift",
    "HAMSTRINGS",
    ["UPPER_BACK", "GLUTES"],
    "DUMBBELL",
    "COMPOUND",
    true,
  ),
  exercise(
    "ex-bulgarian-split-squat",
    "Bulgarian split squat",
    "QUADS",
    ["GLUTES", "CORE"],
    "DUMBBELL",
    "COMPOUND",
    false,
  ),
  exercise(
    "ex-seated-calf-raise",
    "Zittende kuitverhoging",
    "CALVES",
    [],
    "MACHINE",
    "ISOLATION",
    false,
  ),
  exercise(
    "ex-plank",
    "Plank",
    "CORE",
    ["SHOULDERS"],
    "BODYWEIGHT",
    "CORE",
    false,
  ),
  exercise("ex-dead-bug", "Dead bug", "CORE", [], "BODYWEIGHT", "CORE", false),
  exercise(
    "ex-pallof-press",
    "Pallof press",
    "CORE",
    ["SHOULDERS"],
    "CABLE",
    "CORE",
    false,
  ),
  exercise("ex-ab-wheel", "Ab wheel", "CORE", ["LATS"], "OTHER", "CORE", false),
  exercise(
    "ex-back-extension",
    "Back extension",
    "HAMSTRINGS",
    ["CORE", "GLUTES"],
    "BODYWEIGHT",
    "CORE",
    false,
  ),
  exercise(
    "ex-hometrainer",
    "Hometrainer",
    "QUADS",
    ["CALVES"],
    "MACHINE",
    "CARDIO",
    false,
  ),
  exercise(
    "ex-roeiergometer",
    "Roeiergometer",
    "UPPER_BACK",
    ["QUADS", "LATS"],
    "MACHINE",
    "CARDIO",
    false,
  ),
];

// ------------------------------------------------------------------ schema

export interface ProgramDaySeed {
  id: string;
  name: string;
  weekday: number;
  notes?: string;
  exercises: {
    exerciseId: string;
    sets: number;
    repMin: number;
    repMax: number;
    restSeconds?: number;
  }[];
}

export const SEED_PROGRAM = {
  id: "program-ppl-upper",
  name: "Push / Pull / Legs / Upper",
  description:
    "Vier trainingen per week van 60 tot 90 minuten, met core op dinsdag en donderdag. Opbouw boven intensiteit: liever een rep erbij dan een kilo te veel.",
  days: [
    {
      id: "day-push",
      name: "Push",
      weekday: 1,
      exercises: [
        {
          exerciseId: "ex-bankdrukken",
          sets: 3,
          repMin: 6,
          repMax: 10,
          restSeconds: 150,
        },
        {
          exerciseId: "ex-schuine-dumbbell-press",
          sets: 3,
          repMin: 8,
          repMax: 12,
          restSeconds: 120,
        },
        {
          exerciseId: "ex-schouderpers",
          sets: 3,
          repMin: 8,
          repMax: 12,
          restSeconds: 120,
        },
        {
          exerciseId: "ex-laterale-raises",
          sets: 3,
          repMin: 12,
          repMax: 15,
          restSeconds: 90,
        },
        {
          exerciseId: "ex-triceps-pushdown",
          sets: 3,
          repMin: 10,
          repMax: 15,
          restSeconds: 90,
        },
      ],
    },
    {
      id: "day-pull",
      name: "Pull + Core",
      weekday: 2,
      exercises: [
        {
          exerciseId: "ex-lat-pulldown",
          sets: 3,
          repMin: 8,
          repMax: 12,
          restSeconds: 120,
        },
        {
          exerciseId: "ex-chest-supported-row",
          sets: 3,
          repMin: 8,
          repMax: 12,
          restSeconds: 120,
        },
        {
          exerciseId: "ex-kabelroei-zittend",
          sets: 2,
          repMin: 10,
          repMax: 12,
          restSeconds: 120,
        },
        {
          exerciseId: "ex-reverse-pec-deck",
          sets: 3,
          repMin: 12,
          repMax: 15,
          restSeconds: 90,
        },
        {
          exerciseId: "ex-bicepscurl",
          sets: 3,
          repMin: 10,
          repMax: 12,
          restSeconds: 90,
        },
        {
          exerciseId: "ex-kabel-crunch",
          sets: 3,
          repMin: 10,
          repMax: 15,
          restSeconds: 90,
        },
      ],
    },
    {
      id: "day-legs",
      name: "Legs + Core",
      weekday: 4,
      notes:
        "Rustig opbouwen en tussen de sets goed ademen. Leg press als derde oefening, zodat de benen al warm zijn.",
      exercises: [
        {
          exerciseId: "ex-leg-extension",
          sets: 3,
          repMin: 10,
          repMax: 15,
          restSeconds: 120,
        },
        {
          exerciseId: "ex-seated-leg-curl",
          sets: 3,
          repMin: 10,
          repMax: 15,
          restSeconds: 120,
        },
        {
          exerciseId: "ex-leg-press",
          sets: 3,
          repMin: 10,
          repMax: 12,
          restSeconds: 180,
        },
        {
          exerciseId: "ex-kuitverhogingen",
          sets: 3,
          repMin: 12,
          repMax: 15,
          restSeconds: 90,
        },
        {
          exerciseId: "ex-hangende-knieheffing",
          sets: 3,
          repMin: 10,
          repMax: 15,
          restSeconds: 90,
        },
      ],
    },
    {
      id: "day-upper",
      name: "Upper",
      weekday: 5,
      exercises: [
        {
          exerciseId: "ex-schuine-chest-press",
          sets: 3,
          repMin: 8,
          repMax: 12,
          restSeconds: 120,
        },
        {
          exerciseId: "ex-lat-pulldown",
          sets: 3,
          repMin: 8,
          repMax: 12,
          restSeconds: 120,
        },
        {
          exerciseId: "ex-cable-fly",
          sets: 2,
          repMin: 10,
          repMax: 15,
          restSeconds: 90,
        },
        {
          exerciseId: "ex-kabelroei-zittend",
          sets: 3,
          repMin: 8,
          repMax: 12,
          restSeconds: 120,
        },
        {
          exerciseId: "ex-laterale-raises",
          sets: 3,
          repMin: 12,
          repMax: 15,
          restSeconds: 90,
        },
        {
          exerciseId: "ex-bicepscurl",
          sets: 2,
          repMin: 10,
          repMax: 12,
          restSeconds: 90,
        },
        {
          exerciseId: "ex-triceps-extensie",
          sets: 2,
          repMin: 10,
          repMax: 12,
          restSeconds: 90,
        },
      ],
    },
  ] satisfies ProgramDaySeed[],
};

// ------------------------------------------------------------------ ingrediënten

function ing(
  id: string,
  name: string,
  category: ShoppingCategory,
  baseUnit: Unit,
  gramsPerPiece?: number,
): Ingredient {
  return { id, name, category, baseUnit, gramsPerPiece };
}

export const SEED_INGREDIENTS: Ingredient[] = [
  // Groente
  ing("ing-paprika", "Paprika", "VEGETABLES", "PIECE", 150),
  ing("ing-ui", "Ui", "VEGETABLES", "PIECE", 110),
  ing("ing-rode-ui", "Rode ui", "VEGETABLES", "PIECE", 110),
  ing("ing-knoflook", "Knoflook", "VEGETABLES", "PIECE", 5),
  ing("ing-broccoli", "Broccoli", "VEGETABLES", "GRAM"),
  ing("ing-bloemkool", "Bloemkool", "VEGETABLES", "GRAM"),
  ing("ing-courgette", "Courgette", "VEGETABLES", "PIECE", 300),
  ing("ing-wortel", "Wortel", "VEGETABLES", "PIECE", 80),
  ing("ing-komkommer", "Komkommer", "VEGETABLES", "GRAM"),
  ing("ing-cherrytomaten", "Cherrytomaten", "VEGETABLES", "GRAM"),
  ing("ing-spinazie", "Verse spinazie", "VEGETABLES", "GRAM"),
  ing("ing-taugé", "Taugé", "VEGETABLES", "GRAM"),
  ing("ing-doperwten", "Doperwten", "VEGETABLES", "GRAM"),
  ing("ing-lente-ui", "Lente-ui", "VEGETABLES", "PIECE", 15),
  ing("ing-aardappels", "Aardappels", "VEGETABLES", "GRAM"),
  ing("ing-avocado", "Avocado", "VEGETABLES", "PIECE", 200),
  ing("ing-mais", "Maïs", "VEGETABLES", "GRAM"),
  ing("ing-bieslook", "Bieslook", "VEGETABLES", "GRAM"),

  // Fruit
  ing("ing-banaan", "Banaan", "FRUIT", "PIECE", 120),
  ing("ing-blauwe-bessen", "Blauwe bessen", "FRUIT", "GRAM"),
  ing("ing-aardbeien", "Aardbeien", "FRUIT", "GRAM"),
  ing("ing-citroen", "Citroen", "FRUIT", "PIECE", 100),
  ing("ing-limoen", "Limoen", "FRUIT", "PIECE", 70),

  // Zuivel en eieren
  ing("ing-skyr", "Skyr", "DAIRY_EGGS", "GRAM"),
  ing("ing-magere-kwark", "Magere kwark", "DAIRY_EGGS", "GRAM"),
  ing("ing-griekse-yoghurt", "Griekse yoghurt", "DAIRY_EGGS", "GRAM"),
  ing("ing-huttenkase", "Hüttenkäse", "DAIRY_EGGS", "GRAM"),
  ing("ing-halfvolle-melk", "Halfvolle melk", "DAIRY_EGGS", "MILLILITER"),
  ing("ing-ei", "Eieren", "DAIRY_EGGS", "PIECE", 58),
  ing("ing-feta", "Feta", "DAIRY_EGGS", "GRAM"),
  ing("ing-halloumi", "Halloumi", "DAIRY_EGGS", "GRAM"),
  ing("ing-geraspte-kaas", "Geraspte kaas", "DAIRY_EGGS", "GRAM"),
  ing("ing-kookroom", "Kookroom", "DAIRY_EGGS", "MILLILITER"),

  // Proteïne en vleesvervangers
  ing("ing-tofu", "Tofu (naturel, stevig)", "PROTEIN", "GRAM"),
  ing("ing-edamame", "Edamame", "PROTEIN", "GRAM"),
  ing("ing-walnoten", "Walnoten", "PROTEIN", "GRAM"),
  ing("ing-kipfilet", "Kipfilet", "PROTEIN", "GRAM"),

  // Granen, pasta en rijst
  ing("ing-rijst", "Rijst", "GRAINS", "GRAM"),
  ing("ing-havermout", "Havermout", "GRAINS", "GRAM"),
  ing("ing-orzo", "Orzo", "GRAINS", "GRAM"),
  ing("ing-penne", "Penne", "GRAINS", "GRAM"),
  ing("ing-rijstwafels", "Rijstwafels", "GRAINS", "PIECE", 9),
  ing("ing-popcornmais", "Popcornmaïs", "GRAINS", "GRAM"),
  ing("ing-turks-brood", "Turks brood", "GRAINS", "PIECE", 400),

  // Peulvruchten en conserven
  ing("ing-kikkererwten", "Kikkererwten (blik)", "LEGUMES_CANNED", "GRAM"),
  ing("ing-zwarte-bonen", "Zwarte bonen (blik)", "LEGUMES_CANNED", "GRAM"),
  ing("ing-rode-linzen", "Rode linzen", "LEGUMES_CANNED", "GRAM"),
  ing("ing-passata", "Passata", "LEGUMES_CANNED", "MILLILITER"),
  ing("ing-kokosmelk", "Kokosmelk", "LEGUMES_CANNED", "MILLILITER"),

  // Kruiden en specerijen
  ing("ing-kaneel", "Kaneel", "HERBS_SPICES", "TEASPOON"),
  ing("ing-oregano", "Oregano", "HERBS_SPICES", "TEASPOON"),
  ing(
    "ing-italiaanse-kruiden",
    "Italiaanse kruiden",
    "HERBS_SPICES",
    "TEASPOON",
  ),
  ing("ing-komijn", "Komijn", "HERBS_SPICES", "TEASPOON"),
  ing("ing-paprikapoeder", "Gerookt paprikapoeder", "HERBS_SPICES", "TEASPOON"),
  ing("ing-currypasta", "Currypasta", "HERBS_SPICES", "TABLESPOON"),
  ing("ing-gember", "Gemberwortel", "HERBS_SPICES", "TEASPOON"),
  ing("ing-tijm", "Tijm", "HERBS_SPICES", "TEASPOON"),
  ing("ing-zeezout", "Zeezout", "HERBS_SPICES", "TEASPOON"),
  ing("ing-zwarte-peper", "Zwarte peper", "HERBS_SPICES", "TEASPOON"),
  ing("ing-sambal", "Sambal", "HERBS_SPICES", "TEASPOON"),

  // Overig
  ing("ing-olijfolie", "Olijfolie", "OTHER", "TABLESPOON"),
  ing("ing-sesamolie", "Sesamolie", "OTHER", "TEASPOON"),
  ing("ing-zonnebloemolie", "Zonnebloemolie", "OTHER", "TEASPOON"),
  ing("ing-sojasaus", "Sojasaus", "OTHER", "TABLESPOON"),
  ing("ing-ketjap", "Ketjap manis", "OTHER", "TABLESPOON"),
  ing("ing-honing", "Honing", "OTHER", "TEASPOON"),
];

// ------------------------------------------------------------------ recepten

export interface RecipeIngredientSeed {
  ingredientId: string;
  quantity: number;
  unit: Unit;
  note?: string;
}

export type RecipeSeed = Omit<
  Recipe,
  "createdAt" | "updatedAt" | "isFavorite" | "isCustom" | "imageUrl"
> & {
  ingredients: RecipeIngredientSeed[];
};

function recipe(
  id: string,
  name: string,
  category: MealCategory,
  options: {
    description: string;
    instructions: string;
    prepMinutes: number;
    servings: number;
    isVegetarian?: boolean;
    kcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    ingredients: RecipeIngredientSeed[];
  },
): RecipeSeed {
  return {
    id,
    name,
    category,
    description: options.description,
    instructions: options.instructions,
    prepMinutes: options.prepMinutes,
    servings: options.servings,
    isVegetarian: options.isVegetarian ?? true,
    kcalPerServing: options.kcal,
    proteinPerServing: options.protein,
    carbsPerServing: options.carbs,
    fatPerServing: options.fat,
    ingredients: options.ingredients,
  };
}

export const SEED_RECIPES: RecipeSeed[] = [
  // ---------------------------------------------------------------- pre-workout
  recipe("recipe-banaan-skyr", "Banaan met skyr", "PRE_WORKOUT", {
    description: "Licht en snel klaar, zit niet zwaar tijdens de training.",
    instructions:
      "1. Schep de skyr in een schaaltje.\n2. Snijd de banaan in schijfjes en leg die erop.\n3. Besprenkel met honing en bestrooi met kaneel.",
    prepMinutes: 3,
    servings: 1,
    kcal: 290,
    protein: 20,
    carbs: 42,
    fat: 2,
    ingredients: [
      { ingredientId: "ing-skyr", quantity: 150, unit: "GRAM" },
      { ingredientId: "ing-banaan", quantity: 1, unit: "PIECE" },
      { ingredientId: "ing-honing", quantity: 1, unit: "TEASPOON" },
      { ingredientId: "ing-kaneel", quantity: 1, unit: "TEASPOON" },
    ],
  }),
  recipe("recipe-kleine-havermoutbowl", "Kleine havermoutbowl", "PRE_WORKOUT", {
    description: "Kleine portie havermout: genoeg energie, niet te vol.",
    instructions:
      "1. Kook de havermout 3 tot 4 minuten in de melk, blijf roeren.\n2. Haal van het vuur en roer de kaneel erdoor.\n3. Snijd de halve banaan erover.",
    prepMinutes: 8,
    servings: 1,
    kcal: 300,
    protein: 12,
    carbs: 48,
    fat: 6,
    ingredients: [
      { ingredientId: "ing-havermout", quantity: 40, unit: "GRAM" },
      { ingredientId: "ing-halfvolle-melk", quantity: 150, unit: "MILLILITER" },
      { ingredientId: "ing-banaan", quantity: 0.5, unit: "PIECE" },
      { ingredientId: "ing-kaneel", quantity: 1, unit: "TEASPOON" },
    ],
  }),
  recipe("recipe-rijstwafels-skyr", "Rijstwafels met skyr", "PRE_WORKOUT", {
    description: "Luchtig, ligt niet zwaar op de maag voor een zware training.",
    instructions:
      "1. Besmeer de rijstwafels met skyr.\n2. Snijd de aardbeien en verdeel ze erover.\n3. Een paar druppels honing erover.",
    prepMinutes: 4,
    servings: 1,
    kcal: 250,
    protein: 15,
    carbs: 38,
    fat: 2,
    ingredients: [
      { ingredientId: "ing-rijstwafels", quantity: 3, unit: "PIECE" },
      { ingredientId: "ing-skyr", quantity: 100, unit: "GRAM" },
      { ingredientId: "ing-aardbeien", quantity: 60, unit: "GRAM" },
      { ingredientId: "ing-honing", quantity: 1, unit: "TEASPOON" },
    ],
  }),
  recipe("recipe-bananensmoothie", "Bananensmoothie", "PRE_WORKOUT", {
    description:
      "Drinkbare pre-workout voor dagen waarop vast eten te zwaar voelt.",
    instructions:
      "1. Doe alles in de blender.\n2. Blend 30 seconden tot het helemaal glad is.\n3. Drink ongeveer 45 minuten voor de training.",
    prepMinutes: 5,
    servings: 1,
    kcal: 340,
    protein: 22,
    carbs: 52,
    fat: 4,
    ingredients: [
      { ingredientId: "ing-banaan", quantity: 1, unit: "PIECE" },
      { ingredientId: "ing-skyr", quantity: 125, unit: "GRAM" },
      { ingredientId: "ing-halfvolle-melk", quantity: 150, unit: "MILLILITER" },
      { ingredientId: "ing-havermout", quantity: 20, unit: "GRAM" },
      { ingredientId: "ing-kaneel", quantity: 1, unit: "TEASPOON" },
    ],
  }),

  // ---------------------------------------------------------------- lunch
  recipe("recipe-rijstbowl-tofu-ei", "Rijstbowl met tofu en ei", "LUNCH", {
    description: "Stevige lunch na de training, ruim 40 gram proteïne.",
    instructions:
      "1. Kook de rijst volgens de aanwijzingen op het pak.\n2. Snijd de tofu in blokjes en bak die 8 minuten in sesamolie tot ze goudbruin zijn.\n3. Kook de broccoli 5 minuten beetgaar.\n4. Bak de eieren of kook ze 7 minuten.\n5. Doe de rijst in een schaal, leg de tofu, broccoli en eieren erop en schenk de sojasaus erover.\n6. Bestrooi met gesneden lente-ui.",
    prepMinutes: 25,
    servings: 1,
    kcal: 720,
    protein: 45,
    carbs: 78,
    fat: 24,
    ingredients: [
      {
        ingredientId: "ing-rijst",
        quantity: 75,
        unit: "GRAM",
        note: "ongekookt",
      },
      { ingredientId: "ing-tofu", quantity: 125, unit: "GRAM" },
      { ingredientId: "ing-ei", quantity: 2, unit: "PIECE" },
      { ingredientId: "ing-broccoli", quantity: 150, unit: "GRAM" },
      { ingredientId: "ing-sojasaus", quantity: 1, unit: "TABLESPOON" },
      { ingredientId: "ing-sesamolie", quantity: 1, unit: "TEASPOON" },
      { ingredientId: "ing-lente-ui", quantity: 1, unit: "PIECE" },
    ],
  }),
  recipe("recipe-aardappelomelet", "Aardappelomelet met groenten", "LUNCH", {
    description:
      "Omelet met aardappel en paprika; vult goed zonder zwaar te zijn.",
    instructions:
      "1. Snijd de aardappels in dunne schijfjes en kook ze 10 minuten beetgaar.\n2. Bak de ui en paprika 5 minuten in olijfolie.\n3. Voeg de aardappels toe en bak ze kort mee.\n4. Klop de eieren los met paprikapoeder, zout en peper en schenk ze over de groenten.\n5. Bak op laag vuur 8 minuten met een deksel erop, tot de bovenkant gestold is.",
    prepMinutes: 30,
    servings: 1,
    kcal: 620,
    protein: 29,
    carbs: 58,
    fat: 28,
    ingredients: [
      { ingredientId: "ing-aardappels", quantity: 250, unit: "GRAM" },
      { ingredientId: "ing-ei", quantity: 3, unit: "PIECE" },
      { ingredientId: "ing-paprika", quantity: 1, unit: "PIECE" },
      { ingredientId: "ing-ui", quantity: 0.5, unit: "PIECE" },
      { ingredientId: "ing-olijfolie", quantity: 1, unit: "TABLESPOON" },
      { ingredientId: "ing-paprikapoeder", quantity: 1, unit: "TEASPOON" },
      { ingredientId: "ing-zwarte-peper", quantity: 0.5, unit: "TEASPOON" },
    ],
  }),
  recipe(
    "recipe-vegetarische-gebakken-rijst",
    "Vegetarische gebakken rijst",
    "LUNCH",
    {
      description: "Snelle wokschotel, ook lekker met rijst van de dag ervoor.",
      instructions:
        "1. Kook de rijst en laat hem iets afkoelen (of gebruik koude rijst van gisteren).\n2. Bak de tofublokjes 8 minuten in sesamolie.\n3. Voeg knoflook, wortel en doperwten toe en wok 4 minuten.\n4. Schuif alles naar de zijkant, klop de eieren erin en roer ze door de pan.\n5. Voeg de rijst toe met ketjap en sambal en wok alles 3 minuten door.",
      prepMinutes: 25,
      servings: 1,
      kcal: 690,
      protein: 38,
      carbs: 82,
      fat: 21,
      ingredients: [
        {
          ingredientId: "ing-rijst",
          quantity: 75,
          unit: "GRAM",
          note: "ongekookt",
        },
        { ingredientId: "ing-tofu", quantity: 100, unit: "GRAM" },
        { ingredientId: "ing-ei", quantity: 2, unit: "PIECE" },
        { ingredientId: "ing-doperwten", quantity: 80, unit: "GRAM" },
        { ingredientId: "ing-wortel", quantity: 1, unit: "PIECE" },
        {
          ingredientId: "ing-knoflook",
          quantity: 2,
          unit: "PIECE",
          note: "teentjes",
        },
        { ingredientId: "ing-ketjap", quantity: 2, unit: "TABLESPOON" },
        { ingredientId: "ing-sambal", quantity: 1, unit: "TEASPOON" },
        { ingredientId: "ing-sesamolie", quantity: 1, unit: "TEASPOON" },
      ],
    },
  ),
  recipe(
    "recipe-orzosalade-lunch",
    "Orzosalade met kikkererwten en feta",
    "LUNCH",
    {
      description: "Koude lunch die je de avond ervoor kunt maken.",
      instructions:
        "1. Kook de orzo 8 minuten en spoel koud.\n2. Snijd komkommer, tomaatjes en rode ui klein.\n3. Meng de orzo met de kikkererwten en de groenten.\n4. Maak een dressing van olijfolie, citroensap en oregano en schep die erdoor.\n5. Verkruimel de feta erover.",
      prepMinutes: 20,
      servings: 1,
      kcal: 650,
      protein: 26,
      carbs: 72,
      fat: 26,
      ingredients: [
        { ingredientId: "ing-orzo", quantity: 80, unit: "GRAM" },
        {
          ingredientId: "ing-kikkererwten",
          quantity: 150,
          unit: "GRAM",
          note: "uitgelekt",
        },
        { ingredientId: "ing-feta", quantity: 60, unit: "GRAM" },
        { ingredientId: "ing-komkommer", quantity: 100, unit: "GRAM" },
        { ingredientId: "ing-cherrytomaten", quantity: 120, unit: "GRAM" },
        { ingredientId: "ing-rode-ui", quantity: 0.5, unit: "PIECE" },
        { ingredientId: "ing-olijfolie", quantity: 1, unit: "TABLESPOON" },
        { ingredientId: "ing-citroen", quantity: 0.5, unit: "PIECE" },
        { ingredientId: "ing-oregano", quantity: 1, unit: "TEASPOON" },
      ],
    },
  ),
  recipe("recipe-kwarkbowl", "Kwarkbowl met havermout en fruit", "LUNCH", {
    description: "Koude, eiwitrijke lunch zonder kookwerk.",
    instructions:
      "1. Schep de kwark in een schaal.\n2. Roer de havermout erdoor en laat 5 minuten staan.\n3. Leg de bessen en de banaan erop.\n4. Hak de walnoten grof en strooi ze er met de kaneel over.",
    prepMinutes: 7,
    servings: 1,
    kcal: 600,
    protein: 42,
    carbs: 62,
    fat: 18,
    ingredients: [
      { ingredientId: "ing-magere-kwark", quantity: 250, unit: "GRAM" },
      { ingredientId: "ing-havermout", quantity: 40, unit: "GRAM" },
      { ingredientId: "ing-blauwe-bessen", quantity: 75, unit: "GRAM" },
      { ingredientId: "ing-banaan", quantity: 0.5, unit: "PIECE" },
      { ingredientId: "ing-walnoten", quantity: 15, unit: "GRAM" },
      { ingredientId: "ing-kaneel", quantity: 1, unit: "TEASPOON" },
    ],
  }),

  // ---------------------------------------------------------------- avondeten
  recipe(
    "recipe-griekse-orzosalade",
    "Griekse orzosalade met kikkererwten en feta",
    "DINNER",
    {
      description: "Fris avondeten voor twee, lekker na een warme dag.",
      instructions:
        "1. Kook de orzo 8 minuten, giet af en spoel koud.\n2. Snijd komkommer, cherrytomaten en rode ui.\n3. Meng de orzo met de kikkererwten en groenten in een grote schaal.\n4. Klop olijfolie, citroensap, oregano, zout en peper tot een dressing en schep die erdoor.\n5. Verkruimel de feta erover en laat 10 minuten staan voordat je het opdient.",
      prepMinutes: 25,
      servings: 2,
      kcal: 620,
      protein: 24,
      carbs: 70,
      fat: 25,
      ingredients: [
        { ingredientId: "ing-orzo", quantity: 160, unit: "GRAM" },
        {
          ingredientId: "ing-kikkererwten",
          quantity: 240,
          unit: "GRAM",
          note: "1 blik, uitgelekt",
        },
        { ingredientId: "ing-feta", quantity: 100, unit: "GRAM" },
        { ingredientId: "ing-komkommer", quantity: 150, unit: "GRAM" },
        { ingredientId: "ing-cherrytomaten", quantity: 250, unit: "GRAM" },
        { ingredientId: "ing-rode-ui", quantity: 1, unit: "PIECE" },
        { ingredientId: "ing-olijfolie", quantity: 2, unit: "TABLESPOON" },
        { ingredientId: "ing-citroen", quantity: 1, unit: "PIECE" },
        { ingredientId: "ing-oregano", quantity: 2, unit: "TEASPOON" },
      ],
    },
  ),
  recipe(
    "recipe-vegetarische-nasi",
    "Vegetarische nasi met tofu en ei",
    "DINNER",
    {
      description: "Nasi voor twee met tofu, ei en veel groente.",
      instructions:
        "1. Kook de rijst en laat hem uitwasemen.\n2. Snijd de tofu in blokjes en bak ze 10 minuten in sesamolie tot ze krokant zijn. Haal ze uit de pan.\n3. Wok knoflook, gember, wortel en paprika 5 minuten.\n4. Voeg de taugé toe en wok 2 minuten mee.\n5. Klop de eieren los, schuif de groenten opzij en bak de eieren erbij.\n6. Voeg rijst, tofu, ketjap en sambal toe en wok alles 4 minuten door.",
      prepMinutes: 35,
      servings: 2,
      kcal: 700,
      protein: 36,
      carbs: 88,
      fat: 22,
      ingredients: [
        {
          ingredientId: "ing-rijst",
          quantity: 150,
          unit: "GRAM",
          note: "ongekookt",
        },
        { ingredientId: "ing-tofu", quantity: 200, unit: "GRAM" },
        { ingredientId: "ing-ei", quantity: 2, unit: "PIECE" },
        { ingredientId: "ing-wortel", quantity: 2, unit: "PIECE" },
        { ingredientId: "ing-paprika", quantity: 1, unit: "PIECE" },
        { ingredientId: "ing-taugé", quantity: 100, unit: "GRAM" },
        {
          ingredientId: "ing-knoflook",
          quantity: 2,
          unit: "PIECE",
          note: "teentjes",
        },
        {
          ingredientId: "ing-gember",
          quantity: 1,
          unit: "TEASPOON",
          note: "geraspt",
        },
        { ingredientId: "ing-ketjap", quantity: 3, unit: "TABLESPOON" },
        { ingredientId: "ing-sambal", quantity: 1, unit: "TEASPOON" },
        { ingredientId: "ing-sesamolie", quantity: 2, unit: "TEASPOON" },
      ],
    },
  ),
  recipe("recipe-linzenbolognese", "Linzenbolognese met pasta", "DINNER", {
    description: "Stevige pastasaus van rode linzen; ook de dag erna lekker.",
    instructions:
      "1. Snipper de ui, snijd de wortel klein en pers de knoflook.\n2. Fruit de ui 5 minuten in olijfolie, voeg wortel en knoflook toe en bak 3 minuten mee.\n3. Voeg de linzen, passata, Italiaanse kruiden en 150 ml water toe.\n4. Laat 20 minuten zachtjes koken tot de linzen gaar zijn; roer af en toe.\n5. Kook ondertussen de penne beetgaar.\n6. Breng de saus op smaak met zout en peper en schep hem door de pasta. Kaas erover.",
    prepMinutes: 35,
    servings: 2,
    kcal: 680,
    protein: 32,
    carbs: 104,
    fat: 14,
    ingredients: [
      { ingredientId: "ing-penne", quantity: 160, unit: "GRAM" },
      { ingredientId: "ing-rode-linzen", quantity: 150, unit: "GRAM" },
      { ingredientId: "ing-passata", quantity: 400, unit: "MILLILITER" },
      { ingredientId: "ing-ui", quantity: 1, unit: "PIECE" },
      { ingredientId: "ing-wortel", quantity: 1, unit: "PIECE" },
      {
        ingredientId: "ing-knoflook",
        quantity: 2,
        unit: "PIECE",
        note: "teentjes",
      },
      { ingredientId: "ing-italiaanse-kruiden", quantity: 2, unit: "TEASPOON" },
      { ingredientId: "ing-olijfolie", quantity: 1, unit: "TABLESPOON" },
      { ingredientId: "ing-geraspte-kaas", quantity: 40, unit: "GRAM" },
    ],
  }),
  recipe(
    "recipe-burritobowl",
    "Burritobowl met zwarte bonen en tofu",
    "DINNER",
    {
      description: "Bowl voor twee met bonen, tofu en avocado.",
      instructions:
        "1. Kook de rijst.\n2. Snijd de tofu in blokjes, bestrooi met komijn en paprikapoeder en bak ze 10 minuten in olijfolie.\n3. Warm de zwarte bonen met de maïs 5 minuten op.\n4. Snijd de paprika en de avocado.\n5. Verdeel de rijst over twee schalen en leg de tofu, bonen, maïs, paprika en avocado erop.\n6. Maak af met yoghurt en limoensap.",
      prepMinutes: 30,
      servings: 2,
      kcal: 740,
      protein: 38,
      carbs: 86,
      fat: 28,
      ingredients: [
        {
          ingredientId: "ing-rijst",
          quantity: 150,
          unit: "GRAM",
          note: "ongekookt",
        },
        { ingredientId: "ing-tofu", quantity: 200, unit: "GRAM" },
        {
          ingredientId: "ing-zwarte-bonen",
          quantity: 240,
          unit: "GRAM",
          note: "1 blik, uitgelekt",
        },
        { ingredientId: "ing-mais", quantity: 150, unit: "GRAM" },
        { ingredientId: "ing-paprika", quantity: 1, unit: "PIECE" },
        { ingredientId: "ing-avocado", quantity: 1, unit: "PIECE" },
        { ingredientId: "ing-griekse-yoghurt", quantity: 100, unit: "GRAM" },
        { ingredientId: "ing-limoen", quantity: 1, unit: "PIECE" },
        { ingredientId: "ing-komijn", quantity: 2, unit: "TEASPOON" },
        { ingredientId: "ing-paprikapoeder", quantity: 1, unit: "TEASPOON" },
        { ingredientId: "ing-olijfolie", quantity: 1, unit: "TABLESPOON" },
      ],
    },
  ),
  recipe("recipe-groentecurry", "Groentecurry met tofu en rijst", "DINNER", {
    description: "Milde curry met bloemkool en spinazie, niet te vet.",
    instructions:
      "1. Kook de rijst.\n2. Bak de tofublokjes 10 minuten in olijfolie en haal ze uit de pan.\n3. Fruit de ui met knoflook en gember 4 minuten.\n4. Voeg de currypasta toe en bak 1 minuut mee.\n5. Schenk de kokosmelk erbij, voeg de bloemkoolroosjes toe en laat 12 minuten zachtjes koken.\n6. Roer de spinazie en de tofu erdoor tot de spinazie geslonken is. Serveer met de rijst.",
    prepMinutes: 35,
    servings: 2,
    kcal: 760,
    protein: 32,
    carbs: 82,
    fat: 34,
    ingredients: [
      {
        ingredientId: "ing-rijst",
        quantity: 150,
        unit: "GRAM",
        note: "ongekookt",
      },
      { ingredientId: "ing-tofu", quantity: 200, unit: "GRAM" },
      { ingredientId: "ing-kokosmelk", quantity: 400, unit: "MILLILITER" },
      { ingredientId: "ing-bloemkool", quantity: 300, unit: "GRAM" },
      { ingredientId: "ing-spinazie", quantity: 100, unit: "GRAM" },
      { ingredientId: "ing-currypasta", quantity: 2, unit: "TABLESPOON" },
      { ingredientId: "ing-ui", quantity: 1, unit: "PIECE" },
      {
        ingredientId: "ing-knoflook",
        quantity: 2,
        unit: "PIECE",
        note: "teentjes",
      },
      {
        ingredientId: "ing-gember",
        quantity: 1,
        unit: "TEASPOON",
        note: "geraspt",
      },
      { ingredientId: "ing-olijfolie", quantity: 1, unit: "TABLESPOON" },
    ],
  }),
  recipe(
    "recipe-turks-brood-halloumi",
    "Turks brood met halloumi en groenten",
    "DINNER",
    {
      description:
        "Staat in de bibliotheek, maar bevat brood: dat staat op de uitsluitlijst en wordt daarom niet aangeraden.",
      instructions:
        "1. Verwarm de oven voor op 200 graden.\n2. Snijd de halloumi in planken en gril ze 3 minuten per kant.\n3. Bak de courgette en paprika 8 minuten in olijfolie met oregano.\n4. Warm het Turkse brood 6 minuten in de oven en snijd het open.\n5. Vul het brood met de groenten en de halloumi.",
      prepMinutes: 25,
      servings: 2,
      kcal: 820,
      protein: 34,
      carbs: 78,
      fat: 42,
      ingredients: [
        { ingredientId: "ing-turks-brood", quantity: 1, unit: "PIECE" },
        { ingredientId: "ing-halloumi", quantity: 225, unit: "GRAM" },
        { ingredientId: "ing-courgette", quantity: 1, unit: "PIECE" },
        { ingredientId: "ing-paprika", quantity: 1, unit: "PIECE" },
        { ingredientId: "ing-olijfolie", quantity: 2, unit: "TABLESPOON" },
        { ingredientId: "ing-oregano", quantity: 1, unit: "TEASPOON" },
      ],
    },
  ),
  recipe(
    "recipe-aardappelschotel",
    "Aardappel-groenteschotel met ei",
    "DINNER",
    {
      description:
        "Ovenschotel voor twee; je zet hem in de oven en bent even vrij.",
      instructions:
        "1. Verwarm de oven voor op 200 graden.\n2. Snijd de aardappels in blokjes en kook ze 8 minuten voor.\n3. Snijd de courgette en paprika en bak ze 5 minuten in olijfolie.\n4. Meng aardappels en groenten in een ovenschaal.\n5. Klop de eieren met de kookroom, tijm, zout en peper en schenk het mengsel erover.\n6. Strooi de kaas erover en bak 25 minuten tot de bovenkant goudbruin is.",
      prepMinutes: 50,
      servings: 2,
      kcal: 710,
      protein: 33,
      carbs: 68,
      fat: 33,
      ingredients: [
        { ingredientId: "ing-aardappels", quantity: 600, unit: "GRAM" },
        { ingredientId: "ing-courgette", quantity: 1, unit: "PIECE" },
        { ingredientId: "ing-paprika", quantity: 1, unit: "PIECE" },
        { ingredientId: "ing-ei", quantity: 4, unit: "PIECE" },
        { ingredientId: "ing-kookroom", quantity: 100, unit: "MILLILITER" },
        { ingredientId: "ing-geraspte-kaas", quantity: 75, unit: "GRAM" },
        { ingredientId: "ing-olijfolie", quantity: 1, unit: "TABLESPOON" },
        { ingredientId: "ing-tijm", quantity: 1, unit: "TEASPOON" },
      ],
    },
  ),

  // ---------------------------------------------------------------- avondsnack
  recipe("recipe-skyr-bessen", "Skyr met blauwe bessen", "EVENING_SNACK", {
    description: "Eiwitrijk en licht, ongeveer 20 gram proteïne.",
    instructions:
      "1. Schep de skyr in een schaaltje.\n2. Bessen en kaneel erover.",
    prepMinutes: 2,
    servings: 1,
    kcal: 180,
    protein: 22,
    carbs: 18,
    fat: 1,
    ingredients: [
      { ingredientId: "ing-skyr", quantity: 200, unit: "GRAM" },
      { ingredientId: "ing-blauwe-bessen", quantity: 75, unit: "GRAM" },
      { ingredientId: "ing-kaneel", quantity: 1, unit: "TEASPOON" },
    ],
  }),
  recipe("recipe-kwark-kaneel", "Kwark met kaneel", "EVENING_SNACK", {
    description: "Simpel en zoet genoeg zonder dat er veel suiker bij komt.",
    instructions:
      "1. Roer de kaneel door de kwark.\n2. Eventueel een theelepel honing erdoor.",
    prepMinutes: 2,
    servings: 1,
    kcal: 190,
    protein: 26,
    carbs: 14,
    fat: 1,
    ingredients: [
      { ingredientId: "ing-magere-kwark", quantity: 250, unit: "GRAM" },
      { ingredientId: "ing-kaneel", quantity: 1, unit: "TEASPOON" },
      { ingredientId: "ing-honing", quantity: 1, unit: "TEASPOON" },
    ],
  }),
  recipe("recipe-edamame", "Edamame", "EVENING_SNACK", {
    description: "Hartige snack met ongeveer 17 gram proteïne.",
    instructions:
      "1. Kook de edamame 5 minuten in water met zout.\n2. Giet af en bestrooi met een beetje zeezout.",
    prepMinutes: 8,
    servings: 1,
    kcal: 190,
    protein: 17,
    carbs: 14,
    fat: 8,
    ingredients: [
      { ingredientId: "ing-edamame", quantity: 150, unit: "GRAM" },
      { ingredientId: "ing-zeezout", quantity: 0.5, unit: "TEASPOON" },
    ],
  }),
  recipe("recipe-popcorn", "Popcorn", "EVENING_SNACK", {
    description: "Zelf gepoft: weinig vet en geen toegevoegde suiker.",
    instructions:
      "1. Verhit de olie in een pan met deksel.\n2. Voeg de maïs toe en doe het deksel erop.\n3. Schud de pan af en toe tot het poffen stopt.\n4. Bestrooi met wat zeezout.",
    prepMinutes: 8,
    servings: 1,
    kcal: 160,
    protein: 4,
    carbs: 24,
    fat: 6,
    ingredients: [
      { ingredientId: "ing-popcornmais", quantity: 30, unit: "GRAM" },
      { ingredientId: "ing-zonnebloemolie", quantity: 1, unit: "TEASPOON" },
      { ingredientId: "ing-zeezout", quantity: 0.5, unit: "TEASPOON" },
    ],
  }),
  recipe(
    "recipe-huttenkase-komkommer",
    "Hüttenkäse met komkommer",
    "EVENING_SNACK",
    {
      description: "Hartig en eiwitrijk, prettig licht voor het slapen.",
      instructions:
        "1. Schep de hüttenkäse in een schaaltje.\n2. Snijd de komkommer in blokjes en meng die erdoor.\n3. Maak af met bieslook en peper.",
      prepMinutes: 4,
      servings: 1,
      kcal: 170,
      protein: 24,
      carbs: 8,
      fat: 4,
      ingredients: [
        { ingredientId: "ing-huttenkase", quantity: 200, unit: "GRAM" },
        { ingredientId: "ing-komkommer", quantity: 100, unit: "GRAM" },
        { ingredientId: "ing-bieslook", quantity: 5, unit: "GRAM" },
        { ingredientId: "ing-zwarte-peper", quantity: 0.5, unit: "TEASPOON" },
      ],
    },
  ),
];

/**
 * Weekmenu dat als startpunt wordt klaargezet en als sjabloon wordt opgeslagen.
 * Het Turkse brood zit er bewust niet in: brood staat op de uitsluitlijst.
 */
export const SEED_TEMPLATE = {
  id: "template-standaard-trainingsweek",
  name: "Standaard trainingsweek",
  description:
    "Vier trainingsdagen met een lichte pre-workout, een ruimere lunch erna en elke avond vegetarisch eten.",
  items: [
    // maandag (Push)
    {
      weekday: 1,
      slot: "PRE_WORKOUT",
      recipeId: "recipe-banaan-skyr",
      servings: 1,
    },
    {
      weekday: 1,
      slot: "LUNCH",
      recipeId: "recipe-rijstbowl-tofu-ei",
      servings: 1,
    },
    {
      weekday: 1,
      slot: "DINNER",
      recipeId: "recipe-linzenbolognese",
      servings: 2,
    },
    {
      weekday: 1,
      slot: "EVENING_SNACK",
      recipeId: "recipe-skyr-bessen",
      servings: 1,
    },
    // dinsdag (Pull + Core)
    {
      weekday: 2,
      slot: "PRE_WORKOUT",
      recipeId: "recipe-kleine-havermoutbowl",
      servings: 1,
    },
    {
      weekday: 2,
      slot: "LUNCH",
      recipeId: "recipe-vegetarische-gebakken-rijst",
      servings: 1,
    },
    {
      weekday: 2,
      slot: "DINNER",
      recipeId: "recipe-groentecurry",
      servings: 2,
    },
    {
      weekday: 2,
      slot: "EVENING_SNACK",
      recipeId: "recipe-huttenkase-komkommer",
      servings: 1,
    },
    // woensdag (rust)
    { weekday: 3, slot: "LUNCH", recipeId: "recipe-kwarkbowl", servings: 1 },
    {
      weekday: 3,
      slot: "DINNER",
      recipeId: "recipe-aardappelschotel",
      servings: 2,
    },
    {
      weekday: 3,
      slot: "EVENING_SNACK",
      recipeId: "recipe-edamame",
      servings: 1,
    },
    // donderdag (Legs + Core)
    {
      weekday: 4,
      slot: "PRE_WORKOUT",
      recipeId: "recipe-rijstwafels-skyr",
      servings: 1,
    },
    {
      weekday: 4,
      slot: "LUNCH",
      recipeId: "recipe-aardappelomelet",
      servings: 1,
    },
    {
      weekday: 4,
      slot: "DINNER",
      recipeId: "recipe-vegetarische-nasi",
      servings: 2,
    },
    {
      weekday: 4,
      slot: "EVENING_SNACK",
      recipeId: "recipe-kwark-kaneel",
      servings: 1,
    },
    // vrijdag (Upper)
    {
      weekday: 5,
      slot: "PRE_WORKOUT",
      recipeId: "recipe-bananensmoothie",
      servings: 1,
    },
    {
      weekday: 5,
      slot: "LUNCH",
      recipeId: "recipe-orzosalade-lunch",
      servings: 1,
    },
    { weekday: 5, slot: "DINNER", recipeId: "recipe-burritobowl", servings: 2 },
    {
      weekday: 5,
      slot: "EVENING_SNACK",
      recipeId: "recipe-popcorn",
      servings: 1,
    },
    // zaterdag
    { weekday: 6, slot: "LUNCH", recipeId: "recipe-kwarkbowl", servings: 1 },
    {
      weekday: 6,
      slot: "DINNER",
      recipeId: "recipe-griekse-orzosalade",
      servings: 2,
    },
    {
      weekday: 6,
      slot: "EVENING_SNACK",
      recipeId: "recipe-skyr-bessen",
      servings: 1,
    },
    // zondag
    {
      weekday: 7,
      slot: "LUNCH",
      recipeId: "recipe-aardappelomelet",
      servings: 1,
    },
    {
      weekday: 7,
      slot: "DINNER",
      recipeId: "recipe-groentecurry",
      servings: 2,
    },
    {
      weekday: 7,
      slot: "EVENING_SNACK",
      recipeId: "recipe-huttenkase-komkommer",
      servings: 1,
    },
  ] satisfies {
    weekday: number;
    slot: MealCategory;
    recipeId: string;
    servings: number;
  }[],
};
