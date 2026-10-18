import { db } from "../db";
import { createId, nowIso } from "../ids";
import { DEFAULT_SETTINGS } from "../seed";
import type { AppSettings, HouseholdMember } from "../types";

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get("settings");
  if (settings) return settings;

  const fresh: AppSettings = { ...DEFAULT_SETTINGS, updatedAt: nowIso() };
  await db.settings.put(fresh);
  return fresh;
}

export async function updateSettings(
  patch: Partial<Omit<AppSettings, "id">>,
): Promise<void> {
  const current = await getSettings();
  await db.settings.put({
    ...current,
    ...patch,
    id: "settings",
    updatedAt: nowIso(),
  });
}

export function listHouseholdMembers(): Promise<HouseholdMember[]> {
  return db.householdMembers.orderBy("sortOrder").toArray();
}

export async function addHouseholdMember(
  input: Omit<HouseholdMember, "id" | "sortOrder" | "isSelf">,
): Promise<string> {
  const count = await db.householdMembers.count();
  const id = createId();
  await db.householdMembers.put({
    ...input,
    id,
    isSelf: false,
    sortOrder: count,
  });
  return id;
}

export async function updateHouseholdMember(
  id: string,
  patch: Partial<Omit<HouseholdMember, "id">>,
): Promise<void> {
  await db.householdMembers.update(id, patch);
}

export async function deleteHouseholdMember(id: string): Promise<void> {
  const member = await db.householdMembers.get(id);
  if (!member || member.isSelf) return;

  await db.transaction(
    "rw",
    [db.householdMembers, db.plannedMeals],
    async () => {
      await db.householdMembers.delete(id);
      // Verwijder de huisgenoot ook uit geplande maaltijden, anders blijft er een
      // onbekende eter aan een portie hangen.
      const meals = await db.plannedMeals
        .filter((meal) => meal.memberIds.includes(id))
        .toArray();
      for (const meal of meals) {
        await db.plannedMeals.update(meal.id, {
          memberIds: meal.memberIds.filter((memberId) => memberId !== id),
        });
      }
    },
  );
}
