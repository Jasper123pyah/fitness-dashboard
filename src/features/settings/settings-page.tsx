import { useLiveQuery } from "dexie-react-hooks";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  Moon,
  Plus,
  RotateCcw,
  Smartphone,
  Sun,
  SunMoon,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { BackupSummary } from "./backup-summary";
import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { useTheme } from "@/components/theme-provider";
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
import { Switch } from "@/components/ui/switch";
import { downloadBackup, importBackup } from "@/db/backup";
import { getMeta, META_KEYS } from "@/db/db";
import {
  addHouseholdMember,
  deleteHouseholdMember,
  updateHouseholdMember,
  updateSettings,
} from "@/db/repo/settings";
import { resetDatabase } from "@/db/seed";
import type { DietaryPreference, Goal, Theme } from "@/db/types";
import { DIETARY_PREFERENCES, GOALS } from "@/db/types";
import { useHouseholdMembers, useSettings } from "@/hooks/use-settings";
import { WEEKDAY_NAMES } from "@/lib/dates";
import { DIETARY_PREFERENCE_LABELS, GOAL_LABELS } from "@/lib/labels";
import { usePwaStatus } from "@/hooks/use-pwa-status";
import {
  isStandalone,
  requestPersistentStorage,
  type OfflineStatus,
  type StorageStatus,
} from "@/pwa";
import { cn } from "@/lib/utils";

export function SettingsPage() {
  const settings = useSettings();
  const members = useHouseholdMembers();
  const { theme, setTheme } = useTheme();
  const lastBackup = useLiveQuery(
    () => getMeta<string>(META_KEYS.lastBackupAt),
    [],
  );

  const fileInput = useRef<HTMLInputElement>(null);
  const [newMember, setNewMember] = useState("");
  const [excludedDraft, setExcludedDraft] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  if (settings === undefined) return <PageSkeleton />;

  const excluded = settings.excludedIngredients;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Instellingen"
        description="Alles staat lokaal op dit toestel."
      />

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Over jou</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="setting-height">Lengte (cm)</Label>
            <Input
              id="setting-height"
              type="number"
              inputMode="numeric"
              className="h-11"
              defaultValue={settings.heightCm}
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value > 0)
                  void updateSettings({ heightCm: value });
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="setting-startweight">Startgewicht (kg)</Label>
            <Input
              id="setting-startweight"
              type="number"
              inputMode="decimal"
              step="0.1"
              className="h-11"
              defaultValue={settings.startWeightKg}
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value > 0)
                  void updateSettings({ startWeightKg: value });
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Doel</Label>
          <Select
            items={GOAL_LABELS}
            value={settings.goal}
            onValueChange={(value) =>
              void updateSettings({ goal: (value as Goal) ?? "RECOMP" })
            }
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOALS.map((goal) => (
                <SelectItem key={goal} value={goal}>
                  {GOAL_LABELS[goal]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Training</h2>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">Trainingsdagen</legend>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_NAMES.map((name, index) => {
              const weekday = index + 1;
              const active = settings.trainingDays.includes(weekday);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  aria-label={name}
                  onClick={() =>
                    void updateSettings({
                      trainingDays: active
                        ? settings.trainingDays.filter((day) => day !== weekday)
                        : [...settings.trainingDays, weekday].sort(
                            (a, b) => a - b,
                          ),
                    })
                  }
                  className={cn(
                    "flex h-11 items-center justify-center rounded-lg border text-xs font-semibold uppercase transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {name.slice(0, 2)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="setting-rest">Rust (sec)</Label>
            <Input
              id="setting-rest"
              type="number"
              inputMode="numeric"
              className="h-11"
              defaultValue={settings.defaultRestSeconds}
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value >= 0)
                  void updateSettings({ defaultRestSeconds: value });
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="setting-time">Trainingstijd</Label>
            <Input
              id="setting-time"
              type="time"
              className="h-11"
              defaultValue={settings.preferredWorkoutTime}
              onBlur={(event) =>
                void updateSettings({
                  preferredWorkoutTime: event.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="setting-compound">Stap samengesteld (kg)</Label>
            <Input
              id="setting-compound"
              type="number"
              inputMode="decimal"
              step="0.25"
              className="h-11"
              defaultValue={settings.compoundIncrementKg}
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value > 0)
                  void updateSettings({ compoundIncrementKg: value });
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="setting-isolation">Stap isolatie (kg)</Label>
            <Input
              id="setting-isolation"
              type="number"
              inputMode="decimal"
              step="0.25"
              className="h-11"
              defaultValue={settings.isolationIncrementKg}
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value > 0)
                  void updateSettings({ isolationIncrementKg: value });
              }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Voeding</h2>

        <div className="space-y-1.5">
          <Label>Voorkeur</Label>
          <Select
            items={DIETARY_PREFERENCE_LABELS}
            value={settings.dietaryPreference}
            onValueChange={(value) =>
              void updateSettings({
                dietaryPreference: (value as DietaryPreference) ?? "VEGETARIAN",
              })
            }
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIETARY_PREFERENCES.map((preference) => (
                <SelectItem key={preference} value={preference}>
                  {DIETARY_PREFERENCE_LABELS[preference]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="setting-protein-min">Eiwit min (g)</Label>
            <Input
              id="setting-protein-min"
              type="number"
              inputMode="numeric"
              className="h-11"
              defaultValue={settings.proteinTargetMinG}
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value >= 0)
                  void updateSettings({ proteinTargetMinG: value });
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="setting-protein-max">Eiwit max (g)</Label>
            <Input
              id="setting-protein-max"
              type="number"
              inputMode="numeric"
              className="h-11"
              defaultValue={settings.proteinTargetMaxG}
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value >= 0)
                  void updateSettings({ proteinTargetMaxG: value });
              }}
            />
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="text-sm">
            Voedingswaarde tonen
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Schattingen bij recepten. Bijhouden is nooit verplicht.
            </span>
          </span>
          <Switch
            checked={settings.showNutritionInfo}
            onCheckedChange={(checked) =>
              void updateSettings({ showNutritionInfo: checked })
            }
          />
        </label>

        <div className="space-y-2">
          <Label htmlFor="setting-excluded">Uitgesloten ingrediënten</Label>
          <p className="text-xs text-muted-foreground">
            Recepten met deze ingrediënten krijgen een waarschuwing en worden
            niet aangeraden.
          </p>
          <div className="flex flex-wrap gap-2">
            {excluded.map((item) => (
              <span
                key={item}
                className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
              >
                {item}
                <button
                  type="button"
                  aria-label={`${item} van de lijst halen`}
                  onClick={() =>
                    void updateSettings({
                      excludedIngredients: excluded.filter(
                        (value) => value !== item,
                      ),
                    })
                  }
                  className="text-muted-foreground"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="setting-excluded"
              className="h-11"
              value={excludedDraft}
              onChange={(event) => setExcludedDraft(event.target.value)}
              placeholder="bijv. pindakaas"
            />
            <Button
              variant="outline"
              disabled={excludedDraft.trim().length === 0}
              onClick={() => {
                const value = excludedDraft.trim().toLowerCase();
                if (!excluded.includes(value)) {
                  void updateSettings({
                    excludedIngredients: [...excluded, value],
                  });
                }
                setExcludedDraft("");
              }}
            >
              <Plus className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Huisgenoten</h2>
        <p className="text-xs text-muted-foreground">
          Bepaalt de porties bij gedeelde maaltijden. Verder gebeurt er niets
          mee.
        </p>

        <ul className="space-y-2">
          {(members ?? []).map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={member.isVegetarian}
                    onCheckedChange={(checked) =>
                      void updateHouseholdMember(member.id, {
                        isVegetarian: checked === true,
                      })
                    }
                  />
                  vegetarisch
                </label>
              </div>
              {member.isSelf ? (
                <span className="text-xs text-muted-foreground">jij</span>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${member.name} verwijderen`}
                  className="text-muted-foreground"
                  onClick={async () => {
                    await deleteHouseholdMember(member.id);
                    toast.success(`${member.name} verwijderd`);
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Input
            className="h-11"
            value={newMember}
            onChange={(event) => setNewMember(event.target.value)}
            placeholder="Naam"
            aria-label="Naam van de huisgenoot"
          />
          <Button
            variant="outline"
            disabled={newMember.trim().length === 0}
            onClick={async () => {
              await addHouseholdMember({
                name: newMember.trim(),
                isVegetarian: true,
                eatsDinner: true,
              });
              setNewMember("");
            }}
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Weergave</h2>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "LIGHT", label: "Licht", icon: Sun },
              { value: "DARK", label: "Donker", icon: Moon },
              { value: "SYSTEM", label: "Systeem", icon: SunMoon },
            ] as { value: Theme; label: string; icon: typeof Sun }[]
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={theme === option.value}
              onClick={() => {
                setTheme(option.value);
                void updateSettings({ theme: option.value });
              }}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 rounded-lg border text-xs font-medium transition-colors",
                theme === option.value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              <option.icon className="size-4" aria-hidden />
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">Back-up</h2>
        <p className="text-xs text-muted-foreground">
          Je gegevens staan alleen op dit toestel. Maak af en toe een back-up:
          één JSON-bestand met alles erin, inclusief de foto's.
        </p>

        <BackupSummary lastBackupAt={lastBackup ?? null} />

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;

            const confirmed = window.confirm(
              "Een back-up terugzetten vervangt alles wat er nu in de app staat. Doorgaan?",
            );
            if (!confirmed) return;

            setImporting(true);
            try {
              const text = await file.text();
              const result = await importBackup(text);
              const total = Object.values(result.restored).reduce(
                (sum, count) => sum + count,
                0,
              );
              toast.success("Back-up teruggezet", {
                description: `${total} records hersteld.`,
              });
            } catch (error) {
              toast.error("Terugzetten lukte niet", {
                description: error instanceof Error ? error.message : undefined,
              });
            } finally {
              setImporting(false);
            }
          }}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            onClick={async () => {
              const fileName = await downloadBackup();
              toast.success("Back-up gemaakt", { description: fileName });
            }}
          >
            <Download className="size-4" aria-hidden />
            Back-up downloaden
          </Button>
          <Button
            variant="outline"
            disabled={importing}
            onClick={() => fileInput.current?.click()}
          >
            <Upload className="size-4" aria-hidden />
            Back-up terugzetten
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Smartphone className="size-4" aria-hidden />
          Op je telefoon zetten
        </h2>
        {isStandalone() ? (
          <p className="text-xs text-muted-foreground">
            De app draait als geïnstalleerde app.
          </p>
        ) : (
          <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
            <li>Open deze pagina in Safari op je iPhone.</li>
            <li>Tik op het deelicoon onderin.</li>
            <li>Kies "Zet op beginscherm".</li>
            <li>
              Open de app vanaf je beginscherm. Op Android doe je hetzelfde via
              het menu van Chrome met "App installeren".
            </li>
          </ol>
        )}
        <DeviceStatus />
      </section>

      <section className="space-y-3 rounded-xl border border-destructive/30 bg-card p-4">
        <h2 className="font-semibold">Opnieuw beginnen</h2>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Hiermee wis je alle trainingen, recepten, metingen en foto's op dit
          toestel en zet je de standaardinhoud terug. Maak eerst een back-up.
        </p>
        <Button variant="destructive" onClick={() => setResetOpen(true)}>
          <RotateCcw className="size-4" aria-hidden />
          Alles wissen
        </Button>
      </section>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Weet je het zeker?</DialogTitle>
            <DialogDescription>
              Alle gegevens op dit toestel worden gewist. Dit kan niet ongedaan
              worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Annuleren</Button>} />
            <Button
              variant="destructive"
              onClick={async () => {
                await resetDatabase();
                setResetOpen(false);
                toast.success("Alles gewist");
              }}
            >
              Ja, wissen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const OFFLINE_TEXT: Record<
  OfflineStatus["state"],
  { tone: StatusTone; text: string }
> = {
  ready: {
    tone: "ok",
    text: "Offline klaar: de app staat op dit toestel en opent ook zonder internet.",
  },
  installing: {
    tone: "busy",
    text: "Offline-bestanden worden nog opgeslagen. Houd de app even open met internet.",
  },
  error: { tone: "warn", text: "Offlinegebruik is niet gelukt." },
  unsupported: {
    tone: "warn",
    text: "Deze browser ondersteunt geen offlinegebruik.",
  },
  disabled: {
    tone: "warn",
    text: "Offlinegebruik staat uit in de ontwikkelversie.",
  },
};

const STORAGE_TEXT: Record<StorageStatus, { tone: StatusTone; text: string }> =
  {
    persisted: {
      tone: "ok",
      text: "Beschermde opslag: de browser ruimt je gegevens niet zomaar op.",
    },
    "not-persisted": {
      tone: "warn",
      text: "Beschermde opslag is niet toegekend. De browser mag je gegevens opruimen als er ruimte nodig is; maak regelmatig een back-up.",
    },
    unsupported: {
      tone: "warn",
      text: "Deze browser kan de opslag niet beschermen. Maak regelmatig een back-up.",
    },
    checking: { tone: "busy", text: "Opslagstatus controleren…" },
  };

type StatusTone = "ok" | "busy" | "warn";

function StatusLine({
  tone,
  children,
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  const Icon =
    tone === "ok" ? CheckCircle2 : tone === "busy" ? Loader2 : AlertTriangle;
  return (
    <p className="flex items-start gap-2 text-xs text-muted-foreground">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "ok" && "text-primary",
          tone === "busy" && "animate-spin",
          tone === "warn" && "text-destructive",
        )}
        aria-hidden
      />
      <span>{children}</span>
    </p>
  );
}

/** Toont wat de browser werkelijk heeft gedaan, niet wat de app verwacht. */
function DeviceStatus() {
  const { offline, storage } = usePwaStatus();
  const offlineText = OFFLINE_TEXT[offline.state];
  const storageText = STORAGE_TEXT[storage];

  return (
    <div className="space-y-2 border-t pt-3">
      <StatusLine tone={offlineText.tone}>
        {offlineText.text}
        {offline.state === "error" ? ` ${offline.message}` : null}
      </StatusLine>
      <StatusLine tone={storageText.tone}>{storageText.text}</StatusLine>
      {storage === "not-persisted" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const result = await requestPersistentStorage();
            if (result === "persisted") toast.success("Opslag is nu beschermd");
            else
              toast.info("De browser houdt de opslag nog onbeschermd", {
                description:
                  "Browsers beslissen dit zelf, bijvoorbeeld op basis van hoe vaak je de app gebruikt. Op iPhone helpt het om de app vanaf het beginscherm te openen.",
              });
          }}
        >
          Opnieuw vragen
        </Button>
      ) : null}
    </div>
  );
}
