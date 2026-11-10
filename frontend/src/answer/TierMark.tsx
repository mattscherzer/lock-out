import { colour, type Kind } from "../domain/kind.ts";

export function TierMark({ kind, className = "size-14" }: { kind: Kind; className?: string }) {
  const c = colour(kind);
  return (
    <svg viewBox="0 0 56 56" className={`flex-none ${className}`} aria-hidden="true">
      {kind === "high" && (
        <>
          <path d="M28 5 53 49H3Z" fill={c} stroke={c} strokeWidth="4" strokeLinejoin="round" />
          <path
            d="M28 20v14M28 41h.01"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      {kind === "medium" && (
        <>
          <path
            d="M28 4 52 28 28 52 4 28Z"
            fill={c}
            stroke={c}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M19 24h18M19 32h18"
            stroke="#1D1B1C"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      {kind === "low" && (
        <>
          <circle cx="28" cy="28" r="24" fill={c} />
          <path
            d="m18 24 10 10 10-10"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
      {(kind === "limited" || kind === "no-data") && (
        <>
          <circle
            cx="28"
            cy="28"
            r="23"
            fill="var(--surface-container-lowest)"
            stroke={c}
            strokeWidth="3"
            strokeDasharray="5 4"
          />
          <path
            d="M22 22a6 6 0 1 1 8 5.6c-1.5.7-2 1.6-2 3.4M28 38h.01"
            stroke={c}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}
