import { ChevronDown, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import type { Advice } from "../advice/advice.ts";
import { STRINGS } from "../strings.ts";
import { Note } from "./Note.tsx";

const A = STRINGS.advice;

const RULE = "m-0 w-full border-0 border-t border-solid border-outline-variant";

function Layer({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="m-0 title-md">{title}</h3>
      {children}
    </section>
  );
}

export function AdviceDetail({ advice: a, note }: { advice: Advice; note: string | null }) {
  return (
    <>
      {note && <Note>{note}</Note>}
      <Layer title={A.panel.made}>
        <p className="m-0 body-md">{A.panel.madeText}</p>
      </Layer>
      <hr className={RULE} />
      <Layer title={A.allSteps(a.steps.length)}>
        <p className="m-0 body-md font-semibold">{a.headline}</p>
        <ol className="m-0 mt-2 flex list-none flex-col gap-3 p-0 body-md [counter-reset:step]">
          {a.steps.map((s) => (
            <li
              key={s}
              className="flex gap-3 [counter-increment:step] before:grid before:size-6 before:flex-none before:place-items-center before:rounded-full before:bg-surface-container before:label-md before:content-[counter(step)]"
            >
              {s}
            </li>
          ))}
        </ol>
        {a.hint && <p className="m-0 mt-2 body-md">{a.hint}</p>}
      </Layer>
      <Layer title={A.panel.tips}>
        <ul className="m-0 mt-1 flex list-disc flex-col gap-2 pl-5 body-md">
          {a.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Layer>
      <details className="group border-0 border-y border-solid border-outline-variant">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 title-md [&::-webkit-details-marker]:hidden">
          <span className="flex-1">{A.panel.terms}</span>
          <span className="body-md text-on-surface-variant">{a.terms.length}</span>
          <ChevronDown aria-hidden="true" size={20} className="flex-none group-open:rotate-180" />
        </summary>
        <dl className="m-0 pb-4 body-md">
          {a.terms.map((t) => (
            <div key={t.term} className="mb-2 last:mb-0">
              <dt className="font-semibold">{t.term}</dt>
              <dd className="m-0 text-on-surface-variant">{t.meaning}</dd>
            </div>
          ))}
        </dl>
      </details>
      <Layer title={a.sourcesLabel}>
        <ul className="m-0 list-none p-0 body-md">
          {a.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-tap-target items-center gap-2 text-tertiary"
              >
                {s.label}
                <ExternalLink aria-hidden="true" size={20} className="flex-none" />
              </a>
            </li>
          ))}
        </ul>
      </Layer>
    </>
  );
}
