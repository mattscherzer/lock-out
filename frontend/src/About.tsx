import { useRef } from "react";
import { Button } from "./controls/Controls.tsx";
import type { Fixture } from "./search/types.ts";

export function About({ attribution }: { attribution: Fixture["metadata"]["attribution"] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <div className="fixed bottom-6 left-2 z-[800]">
        <Button variant="tonal" onClick={() => dialog.current?.showModal()}>
          About the data
        </Button>
      </div>
      <dialog ref={dialog} aria-labelledby="about-title" className="m-auto box-border max-h-[90dvh] w-[min(36rem,calc(100%-2rem))] overflow-y-auto rounded-lg border-0 bg-surface-container-lowest p-6 text-on-surface">
        <h2 id="about-title" className="headline-sm m-0 mb-2">About the data</h2>
        <p className="body-lg">
          Tiers compare areas by reported bike thefts. They are not the risk to a particular bike, and thin or missing data does not mean an area has no thefts.
        </p>
        <h3 className="title-md mb-1">Limits</h3>
        <ul className="body-lg mt-0">
          <li>Open data covers about three quarters of the police's own figure.</li>
          <li>Many thefts are never reported.</li>
          <li>Recent reports arrive late, so the latest weeks are left out.</li>
          <li>The data covers one year, so seasons are not modelled.</li>
        </ul>
        <h3 className="title-md mb-1">Sources</h3>
        <ul className="body-lg mt-0">
          <li>{attribution.police}</li>
          <li>{attribution.lor}</li>
          <li>
            <a href="https://www.openstreetmap.org/copyright">{attribution.osm}</a>
          </li>
        </ul>
        <Button onClick={() => dialog.current?.close()}>Close</Button>
      </dialog>
    </>
  );
}
