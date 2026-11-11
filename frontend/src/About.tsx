import { useEffect, useRef } from "react";
import { Button } from "./controls/Controls.tsx";
import type { Lookup } from "./domain/lookup.ts";
import { STRINGS } from "./strings.ts";

const S = STRINGS.about;

// Opened from the "About the data" link in the map attribution: a floating button would cover that text.
export function About({
  attribution,
  open,
  onClose,
}: {
  attribution: Lookup["metadata"]["attribution"];
  open: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close?.();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="about-title"
      className="m-auto box-border max-h-[90dvh] w-[min(36rem,calc(100%-2rem))] overflow-y-auto rounded-lg border-0 bg-surface-container-lowest p-6 text-on-surface"
    >
      <h2 id="about-title" className="m-0 mb-2 headline-sm">
        {S.title}
      </h2>
      <p className="body-lg">{S.intro}</p>
      <h3 className="mb-1 title-md">{S.limitsTitle}</h3>
      <ul className="mt-0 body-lg">
        {S.limits.map((limit) => (
          <li key={limit}>{limit}</li>
        ))}
      </ul>
      <h3 className="mb-1 title-md">{S.sourcesTitle}</h3>
      <ul className="mt-0 body-lg">
        <li>{attribution.police}</li>
        <li>{attribution.lor}</li>
        <li>
          <a href="https://www.openstreetmap.org/copyright">{attribution.osm}</a>
        </li>
      </ul>
      <Button onClick={onClose}>{S.close}</Button>
    </dialog>
  );
}
