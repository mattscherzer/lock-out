import { useEffect, useRef } from "react";
import { Button } from "./controls/Controls.tsx";
import type { Fixture } from "./search/types.ts";

// Opened from the "About the data" link in the map attribution: a floating button would cover that text.
export function About({
  attribution,
  open,
  onClose,
}: {
  attribution: Fixture["metadata"]["attribution"];
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
        About the data
      </h2>
      <p className="body-lg">
        Tiers compare areas by reported bike thefts. They are not the risk to a particular bike, and
        thin or missing data does not mean an area has no thefts.
      </p>
      <h3 className="mb-1 title-md">Limits</h3>
      <ul className="mt-0 body-lg">
        <li>Open data covers about three quarters of the police's own figure.</li>
        <li>Many thefts are never reported.</li>
        <li>Recent reports arrive late, so the latest weeks are left out.</li>
        <li>The data covers one year, so seasons are not modelled.</li>
      </ul>
      <h3 className="mb-1 title-md">Sources</h3>
      <ul className="mt-0 body-lg">
        <li>{attribution.police}</li>
        <li>{attribution.lor}</li>
        <li>
          <a href="https://www.openstreetmap.org/copyright">{attribution.osm}</a>
        </li>
      </ul>
      <Button onClick={onClose}>Close</Button>
    </dialog>
  );
}
