import {
  Anchor,
  ArrowDownToLine,
  Ban,
  ChevronRight,
  Link,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useId } from "react";
import type { Advice as AdviceResult, KeyStep } from "../advice/advice.ts";
import { Button, Choice } from "../controls/Controls.tsx";
import { STRINGS } from "../strings.ts";
import { Note } from "./Note.tsx";

const A = STRINGS.advice;

const KEY_ICON: Record<KeyStep, LucideIcon> = {
  anchor: Anchor,
  solidLock: Lock,
  neverAlone: Ban,
  position: ArrowDownToLine,
  secondLock: Link,
};

function Banner({ advice }: { advice: AdviceResult }) {
  const icons = advice.level === "twoLocks" ? [Lock, Link] : [Lock];
  return (
    <div className="flex items-center gap-3 rounded-lg bg-primary-container p-3 text-on-primary-container">
      <div className="flex gap-1" aria-hidden="true">
        {icons.map((Icon, i) => (
          <span
            key={i}
            className="grid size-10 flex-none place-items-center rounded-full bg-surface-container-lowest"
          >
            <Icon size={20} />
          </span>
        ))}
      </div>
      <div>
        <h4 className="m-0 headline-sm">{advice.banner}</h4>
        <p className="m-0 body-md">{advice.why}</p>
      </div>
    </div>
  );
}

function KeyList({ keys }: { keys: AdviceResult["keys"] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-3 p-0 body-md">
      {keys.map(({ id, text }) => {
        const Icon = KEY_ICON[id];
        return (
          <li key={id} className="flex items-start gap-2">
            <Icon aria-hidden="true" size={20} className="flex-none" />
            {text}
          </li>
        );
      })}
    </ul>
  );
}

export function Advice({
  advice: a,
  note,
  bikeValue,
  onBikeValue,
  onMore,
}: {
  advice: AdviceResult;
  note: string | null;
  bikeValue: string;
  onBikeValue: (value: string) => void;
  onMore: () => void;
}) {
  const heading = useId();
  return (
    <section
      aria-labelledby={heading}
      className="flex flex-col gap-4 border-0 border-t border-solid border-outline-variant pt-4"
    >
      <h3 id={heading} className="m-0 title-md">
        {A.sectionTitle}
      </h3>
      {note && <Note>{note}</Note>}
      <Choice
        variant="tag"
        label={A.bikeCaption}
        options={Object.entries(A.bikeValue).map(([value, label]) => ({ value, label }))}
        value={bikeValue}
        onChange={onBikeValue}
      />
      <Banner advice={a} />
      {a.hint && <p className="m-0 body-md">{a.hint}</p>}
      <KeyList keys={a.keys} />
      <Button variant="tonal" className="self-center" onClick={onMore} aria-haspopup="dialog">
        {A.allSteps(a.steps.length)}
        <ChevronRight aria-hidden="true" size={18} />
      </Button>
    </section>
  );
}
