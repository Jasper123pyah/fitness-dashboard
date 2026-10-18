import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Camera, Images, Lock, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addPhoto,
  compressImage,
  deletePhoto,
  listPhotos,
} from "@/db/repo/progress";
import type { PhotoCategory, ProgressPhoto } from "@/db/types";
import { formatShortDate, todayKey } from "@/lib/dates";
import { PHOTO_CATEGORY_LABELS, PHOTO_CATEGORY_ORDER } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * Object-URL's voor de foto's. Die moeten weer worden vrijgegeven, anders
 * blijven de afbeeldingen in het geheugen hangen.
 */
function usePhotoUrls(photos: ProgressPhoto[] | undefined) {
  const urls = useMemo(() => {
    const map = new Map<string, string>();
    for (const photo of photos ?? []) {
      map.set(photo.id, URL.createObjectURL(photo.blob));
    }
    return map;
  }, [photos]);

  useEffect(() => {
    return () => {
      for (const url of urls.values()) URL.revokeObjectURL(url);
    };
  }, [urls]);

  return urls;
}

export function PhotosPage() {
  const photos = useLiveQuery(() => listPhotos(), []);
  const urls = usePhotoUrls(photos);
  const [category, setCategory] = useState<PhotoCategory>("FRONT");
  const [compareLeft, setCompareLeft] = useState<string | null>(null);
  const [compareRight, setCompareRight] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const forCategory = useMemo(
    () => (photos ?? []).filter((photo) => photo.category === category),
    [photos, category],
  );

  const photoLabels = Object.fromEntries(
    forCategory.map((photo) => [photo.id, formatShortDate(photo.date)]),
  );

  if (photos === undefined) return <PageSkeleton />;

  const left = forCategory.find((photo) => photo.id === compareLeft);
  const right = forCategory.find((photo) => photo.id === compareRight);

  return (
    <div className="space-y-5">
      <Button
        nativeButton={false}
        render={<Link to="/voortgang" />}
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voortgang
      </Button>

      <PageHeader
        title="Foto's"
        description={`${photos.length} foto's op dit toestel`}
      />

      <p className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
        De foto's blijven in de app op dit toestel. Ze worden nergens geüpload
        en staan ook niet in je fotorol. Maak af en toe een back-up als je ze
        wilt bewaren.
      </p>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {PHOTO_CATEGORY_ORDER.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setCategory(option);
              setCompareLeft(null);
              setCompareRight(null);
            }}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === option
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {PHOTO_CATEGORY_LABELS[option]}
          </button>
        ))}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;

          setBusy(true);
          try {
            const blob = await compressImage(file);
            await addPhoto({ date: todayKey(), category, blob });
            toast.success("Foto toegevoegd");
          } catch {
            toast.error("Foto toevoegen lukte niet");
          } finally {
            setBusy(false);
          }
        }}
      />

      <Button
        size="lg"
        className="w-full"
        disabled={busy}
        onClick={() => fileInput.current?.click()}
      >
        <Camera className="size-5" aria-hidden />
        Foto toevoegen ({PHOTO_CATEGORY_LABELS[category].toLowerCase()})
      </Button>

      {forCategory.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Nog geen foto's"
          description="Maak de foto's het liefst op dezelfde plek, met hetzelfde licht en dezelfde houding."
        />
      ) : (
        <>
          {forCategory.length > 1 ? (
            <section className="space-y-3 rounded-xl border bg-card p-4">
              <h2 className="text-sm font-semibold">Vergelijken</h2>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  items={photoLabels}
                  value={compareLeft ?? ""}
                  onValueChange={(value) => setCompareLeft(value || null)}
                >
                  <SelectTrigger className="h-11" aria-label="Eerste foto">
                    <SelectValue placeholder="Eerste" />
                  </SelectTrigger>
                  <SelectContent>
                    {forCategory.map((photo) => (
                      <SelectItem key={photo.id} value={photo.id}>
                        {formatShortDate(photo.date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  items={photoLabels}
                  value={compareRight ?? ""}
                  onValueChange={(value) => setCompareRight(value || null)}
                >
                  <SelectTrigger className="h-11" aria-label="Tweede foto">
                    <SelectValue placeholder="Tweede" />
                  </SelectTrigger>
                  <SelectContent>
                    {forCategory.map((photo) => (
                      <SelectItem key={photo.id} value={photo.id}>
                        {formatShortDate(photo.date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {left && right ? (
                <div className="grid grid-cols-2 gap-2">
                  {[left, right].map((photo, index) => (
                    <figure key={`${photo.id}-${index}`}>
                      <img
                        src={urls.get(photo.id)}
                        alt={`${PHOTO_CATEGORY_LABELS[photo.category]} op ${formatShortDate(photo.date)}`}
                        className="aspect-[3/4] w-full rounded-lg object-cover"
                      />
                      <figcaption className="mt-1 text-center text-xs text-muted-foreground">
                        {formatShortDate(photo.date)}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Kies twee datums om de foto's naast elkaar te zien.
                </p>
              )}
            </section>
          ) : null}

          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Alle foto's ({PHOTO_CATEGORY_LABELS[category].toLowerCase()})
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {forCategory.map((photo) => (
                <li key={photo.id} className="group relative">
                  <img
                    src={urls.get(photo.id)}
                    alt={`${PHOTO_CATEGORY_LABELS[photo.category]} op ${formatShortDate(photo.date)}`}
                    className="aspect-[3/4] w-full rounded-lg object-cover"
                  />
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatShortDate(photo.date)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Foto van ${formatShortDate(photo.date)} verwijderen`}
                      className="text-muted-foreground"
                      onClick={async () => {
                        await deletePhoto(photo.id);
                        toast.success("Foto verwijderd");
                      }}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
