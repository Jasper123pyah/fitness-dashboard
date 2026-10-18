import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDayMonth } from "@/lib/dates";
import { formatQuantity } from "@/lib/units";

export interface SeriesPoint {
  date: string;
  value: number;
  secondary?: number;
}

/**
 * Eén lijngrafiek voor alle voortgangsschermen: gewicht, omtrek en de
 * gewichten per oefening. Alleen echte metingen worden getekend.
 */
export function ProgressLineChart({
  data,
  unit,
  height = 200,
  secondaryLabel,
  valueLabel = "Waarde",
}: {
  data: SeriesPoint[];
  unit: string;
  height?: number;
  secondaryLabel?: string;
  valueLabel?: string;
}) {
  if (data.length === 0) return null;

  const values = data.flatMap((point) =>
    point.secondary != null ? [point.value, point.secondary] : [point.value],
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.15, unit === "kg" ? 1 : 0.5);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDayMonth(value)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            minTickGap={24}
          />
          <YAxis
            domain={[Math.floor(min - padding), Math.ceil(max + padding)]}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
            labelFormatter={(label) =>
              typeof label === "string"
                ? formatDayMonth(label)
                : String(label ?? "")
            }
            formatter={(value, name) => [
              `${formatQuantity(Number(value))} ${unit}`,
              name === "secondary"
                ? (secondaryLabel ?? "Gemiddelde")
                : valueLabel,
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 2.5, strokeWidth: 0, fill: "var(--chart-1)" }}
            activeDot={{ r: 4 }}
          />
          {data.some((point) => point.secondary != null) ? (
            <Line
              type="monotone"
              dataKey="secondary"
              stroke="var(--chart-2)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
