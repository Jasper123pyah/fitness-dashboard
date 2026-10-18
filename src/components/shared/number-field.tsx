import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function parseNumber(raw: string): number | null {
  const normalized = raw.replace(",", ".").trim();
  if (normalized === "") return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function formatValue(value: number | null): string {
  if (value == null) return "";
  return String(value).replace(".", ",");
}

/**
 * Numeriek veld voor gewicht en herhalingen.
 *
 * Tijdens het typen blijft de ruwe tekst staan (zodat "52," niet omslaat naar
 * "52") en wordt elke wijziging direct doorgegeven. De aanroeper schrijft die
 * meteen weg; als de browser halverwege de training sluit, staat alles er nog.
 */
export function NumberField({
  value,
  onChange,
  placeholder,
  decimal = false,
  ariaLabel,
  className,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  decimal?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(() => formatValue(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(formatValue(value));
  }, [value]);

  return (
    <Input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      enterKeyHint="done"
      autoComplete="off"
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={draft}
      onFocus={(event) => {
        focused.current = true;
        event.currentTarget.select();
      }}
      onBlur={() => {
        focused.current = false;
        setDraft(formatValue(value));
      }}
      onChange={(event) => {
        const next = event.target.value;
        if (!/^[0-9]*[.,]?[0-9]*$/.test(next)) return;
        setDraft(next);
        onChange(parseNumber(next));
      }}
      className={cn(
        "h-11 px-2 text-center text-base font-medium tabular-nums md:text-base",
        className,
      )}
    />
  );
}
