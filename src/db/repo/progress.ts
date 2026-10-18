import { db } from "../db";
import { createId, nowIso } from "../ids";
import type {
  BodyMeasurement,
  MeasurementType,
  PhotoCategory,
  ProgressPhoto,
  WeightEntry,
} from "../types";
import type { DateKey } from "@/lib/dates";

export function listWeightEntries(): Promise<WeightEntry[]> {
  return db.weightEntries.orderBy("date").toArray();
}

/** Eén weging per dag; een tweede weging op dezelfde dag werkt de bestaande bij. */
export async function saveWeightEntry(input: {
  date: DateKey;
  weightKg: number;
  note?: string;
}): Promise<string> {
  const existing = await db.weightEntries
    .where("date")
    .equals(input.date)
    .first();
  const id = existing?.id ?? createId();
  await db.weightEntries.put({
    id,
    date: input.date,
    weightKg: input.weightKg,
    note: input.note,
  });
  return id;
}

export async function deleteWeightEntry(id: string): Promise<void> {
  await db.weightEntries.delete(id);
}

export function listMeasurements(): Promise<BodyMeasurement[]> {
  return db.bodyMeasurements.orderBy("date").toArray();
}

export async function saveMeasurement(input: {
  date: DateKey;
  type: MeasurementType;
  valueCm: number;
  note?: string;
}): Promise<string> {
  const existing = await db.bodyMeasurements
    .where("[date+type]")
    .equals([input.date, input.type])
    .first();
  const id = existing?.id ?? createId();
  await db.bodyMeasurements.put({ id, ...input });
  return id;
}

export async function deleteMeasurement(id: string): Promise<void> {
  await db.bodyMeasurements.delete(id);
}

export function listPhotos(): Promise<ProgressPhoto[]> {
  return db.progressPhotos.orderBy("date").reverse().toArray();
}

export async function addPhoto(input: {
  date: DateKey;
  category: PhotoCategory;
  blob: Blob;
  note?: string;
}): Promise<string> {
  const id = createId();
  const dimensions = await readImageSize(input.blob);

  await db.progressPhotos.put({
    id,
    date: input.date,
    category: input.category,
    blob: input.blob,
    mimeType: input.blob.type || "image/jpeg",
    sizeBytes: input.blob.size,
    width: dimensions?.width,
    height: dimensions?.height,
    note: input.note,
    createdAt: nowIso(),
  });
  return id;
}

export async function deletePhoto(id: string): Promise<void> {
  await db.progressPhotos.delete(id);
}

async function readImageSize(
  blob: Blob,
): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    const bitmap = await createImageBitmap(blob);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

/**
 * Verkleint een foto voordat die wordt opgeslagen. Een telefoonfoto van 4 MB
 * past makkelijk in IndexedDB, maar een back-up van honderd foto's niet meer.
 */
export async function compressImage(
  file: File,
  options: { maxSize?: number; quality?: number } = {},
): Promise<Blob> {
  const maxSize = options.maxSize ?? 1600;
  const quality = options.quality ?? 0.82;

  if (
    typeof createImageBitmap !== "function" ||
    typeof OffscreenCanvas === "undefined"
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return await canvas.convertToBlob({ type: "image/jpeg", quality });
  } catch {
    return file;
  }
}
