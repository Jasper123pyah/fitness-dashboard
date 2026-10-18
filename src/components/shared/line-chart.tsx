import { lazy, Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { SeriesPoint } from "./line-chart-impl";

export type { SeriesPoint };

/**
 * De grafiekbibliotheek is groot en staat niet op elk scherm. Hij wordt pas
 * geladen als er echt een grafiek getekend moet worden; de rest van de app
 * start daardoor sneller.
 */
const LineChartImpl = lazy(() =>
  import("./line-chart-impl").then((module) => ({
    default: module.ProgressLineChart,
  })),
);

export function ProgressLineChart(props: {
  data: SeriesPoint[];
  unit: string;
  height?: number;
  secondaryLabel?: string;
  valueLabel?: string;
}) {
  if (props.data.length === 0) return null;

  return (
    <Suspense
      fallback={
        <Skeleton style={{ height: props.height ?? 200 }} className="w-full" />
      }
    >
      <LineChartImpl {...props} />
    </Suspense>
  );
}
