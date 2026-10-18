import { beforeEach, describe, expect, it } from "vitest";

import { exportBackup, importBackup, parseBackup, BackupError } from "./backup";
import { db } from "./db";
import { seedDatabase } from "./seed";
import { saveWeightEntry } from "./repo/progress";
import { updateSettings } from "./repo/settings";
import {
  completeSession,
  getSessionDetail,
  startSessionFromDay,
  updateSet,
} from "./repo/workouts";

describe("back-up maken en terugzetten", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedDatabase();
  });

  it("zet alles in één bestand en weer terug", async () => {
    await saveWeightEntry({ date: "2026-10-12", weightKg: 75.4 });
    await updateSettings({ heightCm: 183, proteinTargetMinG: 130 });

    const sessionId = await startSessionFromDay("day-push");
    const detail = await getSessionDetail(sessionId);
    await updateSet(detail!.exercises[0].sets[0].id, {
      weightKg: 52.5,
      reps: 9,
      completed: true,
    });
    await completeSession(sessionId);

    const backup = await exportBackup();
    expect(backup.format).toBe("trainlog-backup");
    expect(backup.counts.recipes).toBeGreaterThan(20);
    expect(backup.counts.exercises).toBeGreaterThan(30);

    // Alles wissen, alsof de app op een nieuw toestel wordt geïnstalleerd.
    await db.delete();
    await db.open();
    expect(await db.weightEntries.count()).toBe(0);

    await importBackup(JSON.stringify(backup));

    expect(await db.weightEntries.count()).toBe(1);
    expect((await db.settings.get("settings"))?.proteinTargetMinG).toBe(130);

    const restored = await getSessionDetail(sessionId);
    expect(restored?.status).toBe("COMPLETED");
    expect(restored?.exercises[0].sets[0]).toMatchObject({
      weightKg: 52.5,
      reps: 9,
    });
  });

  it("neemt voortgangsfoto's mee", async () => {
    const blob = new Blob([new Uint8Array([137, 80, 78, 71])], {
      type: "image/png",
    });
    await db.progressPhotos.put({
      id: "photo-1",
      date: "2026-10-12",
      category: "FRONT",
      blob,
      mimeType: "image/png",
      sizeBytes: blob.size,
      createdAt: new Date().toISOString(),
    });

    const backup = await exportBackup();
    expect(
      backup.data.progressPhotos[0].blobDataUrl.startsWith("data:image/png"),
    ).toBe(true);

    await db.progressPhotos.clear();
    await importBackup(JSON.stringify(backup));

    const restored = await db.progressPhotos.get("photo-1");
    expect(restored).toBeDefined();
    expect(await restored!.blob.arrayBuffer()).toEqual(
      await blob.arrayBuffer(),
    );
  });

  it("weigert een bestand dat geen back-up van deze app is", () => {
    expect(() => parseBackup("{}")).toThrow(BackupError);
    expect(() => parseBackup("geen json")).toThrow(BackupError);
    expect(() =>
      parseBackup(
        JSON.stringify({ format: "trainlog-backup", version: 99, data: {} }),
      ),
    ).toThrow(/nieuwere versie/);
  });

  it("vult standaardinhoud aan die in een oudere back-up ontbreekt", async () => {
    const backup = await exportBackup();
    const stripped = {
      ...backup,
      data: { ...backup.data, exercises: [], recipes: [], meta: [] },
    };

    await importBackup(JSON.stringify(stripped));

    // Het seeden draait opnieuw, dus de standaardoefeningen staan er weer.
    expect(await db.exercises.count()).toBeGreaterThan(30);
    expect(await db.recipes.count()).toBeGreaterThan(20);
  });
});
