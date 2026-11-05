import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { ICON_BUTTON } from "./iconButton.ts";

// Level 3. Not a modal: the map stays reachable behind the scrim and the page keeps its tab order, so only focus entry, return and Esc are handled.
export function ExplainSheet({
  open,
  collapsed,
  onClose,
  children,
}: {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) close.current?.focus();
  }, [open]);
  return (
    <>
      <div
        className="explain-frame invisible fixed top-0 bottom-0 left-0 z-[calc(var(--z-search)-3)] hidden w-[calc(var(--answer-panel-w)+var(--explain-shift))] -translate-x-(--explain-shift) rounded-r-lg bg-surface-container shadow-elevation-3 transition-[translate,visibility] duration-slow ease-standard data-collapsed:-translate-x-(--pair-shift) data-open:visible data-open:translate-x-0 data-open:data-collapsed:-translate-x-(--pair-shift) min-[900px]:block"
        data-open={open || undefined}
        data-collapsed={collapsed || undefined}
      />
      <div
        className="explain-scrim pointer-events-none fixed inset-0 z-modal bg-scrim opacity-0 transition-opacity duration-base data-open:pointer-events-auto data-open:opacity-100 data-open:data-collapsed:pointer-events-none data-open:data-collapsed:opacity-0 min-[600px]:right-auto min-[600px]:w-(--answer-panel-w) min-[900px]:hidden"
        data-open={open || undefined}
        data-collapsed={collapsed || undefined}
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-label="What this rating means"
        className="explain-sheet invisible fixed right-0 bottom-0 left-0 z-[calc(var(--z-modal)+1)] flex max-h-[92dvh] translate-y-[102%] flex-col rounded-t-xl bg-surface-container-lowest text-on-surface shadow-elevation-sheet transition-[translate,visibility] duration-slow ease-standard data-open:visible data-open:translate-y-0 data-open:data-collapsed:invisible data-open:data-collapsed:translate-y-[102%] min-[600px]:right-auto min-[600px]:w-(--answer-panel-w) min-[900px]:top-2 min-[900px]:bottom-2 min-[900px]:left-[calc(var(--answer-panel-w)+var(--space-2))] min-[900px]:z-[calc(var(--z-search)-2)] min-[900px]:max-h-none min-[900px]:w-(--explain-w) min-[900px]:-translate-x-(--explain-shift) min-[900px]:translate-y-0 min-[900px]:rounded-lg min-[900px]:shadow-none min-[900px]:data-collapsed:-translate-x-(--pair-shift) min-[900px]:data-open:translate-x-0 min-[900px]:data-open:data-collapsed:-translate-x-(--pair-shift) min-[900px]:data-open:data-collapsed:translate-y-0"
        data-open={open || undefined}
        data-collapsed={collapsed || undefined}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          e.stopPropagation();
          onClose();
        }}
      >
        <header className="flex flex-none items-center justify-between pt-3 pr-2 pb-1 pl-4">
          <h2 className="m-0 title-lg">What this rating means</h2>
          <button
            ref={close}
            type="button"
            className={ICON_BUTTON}
            aria-label="Close"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-4 pt-2 pb-5">{children}</div>
      </section>
    </>
  );
}
