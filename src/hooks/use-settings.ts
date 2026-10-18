import { useLiveQuery } from "dexie-react-hooks";

import { getSettings, listHouseholdMembers } from "@/db/repo/settings";
import type { AppSettings, HouseholdMember } from "@/db/types";

export function useSettings(): AppSettings | undefined {
  return useLiveQuery(() => getSettings(), []);
}

export function useHouseholdMembers(): HouseholdMember[] | undefined {
  return useLiveQuery(() => listHouseholdMembers(), []);
}
