import type { Selector } from "../search/types.ts";

const BAR_MAX = 56;

export function BarGroup({
  label,
  labels,
  selector,
  perDay,
}: {
  label: string;
  labels: Record<string, string>;
  selector: Selector;
  perDay?: Record<string, number>;
}) {
  const values = Object.entries(selector.shares).map(
    ([key, share]) => [key, (share / (perDay?.[key] ?? 1)) * 100] as const,
  );
  const top = Math.max(...values.map(([, v]) => v));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="title-sm">{label}</div>
      <div
        role="img"
        aria-label={`${label}: ${values.map(([key, v]) => `${labels[key]} ${Math.round(v)}%`).join(", ")}`}
        className="flex items-end gap-1.5"
      >
        {values.map(([key, v]) => (
          <div
            key={key}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1 pb-1 label-md text-on-surface-variant"
            aria-hidden="true"
          >
            <em className="font-semibold text-on-surface not-italic tabular-nums">
              {Math.round(v)}%
            </em>
            <b
              className="block w-full rounded-t-xs bg-primary"
              style={{ height: Math.round((v / top) * BAR_MAX) }}
            />
            {labels[key]}
          </div>
        ))}
      </div>
    </div>
  );
}
