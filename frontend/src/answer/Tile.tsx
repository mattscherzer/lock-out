export function Tile({ big, text }: { big: string; text: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-surface-container px-3 py-2.5">
      <strong className="font-display text-[26px]/[30px] font-semibold tabular-nums">{big}</strong>
      <span className="body-sm text-on-surface-variant">{text}</span>
    </div>
  );
}
