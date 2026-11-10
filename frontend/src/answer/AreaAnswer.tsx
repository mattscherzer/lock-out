import { useState } from "react";
import type { AreaRecord, Lookup } from "../domain/lookup.ts";
import { adviceFor, DEFAULT_BIKE_VALUE } from "../advice/advice.ts";
import { STRINGS } from "../strings.ts";
import { Advice } from "./Advice.tsx";
import { AdviceDetail } from "./AdviceDetail.tsx";
import { AnswerCard } from "./AnswerCard.tsx";
import { Details } from "./Details.tsx";
import { Explain } from "./Explain.tsx";
import { kindOf, topShare } from "../domain/kind.ts";
import { Verdict, VerdictStrip } from "./Verdict.tsx";

export function AreaAnswer({
  record,
  areaId,
  lookup,
  open,
  lowerSignal,
  onClose,
  onAbout,
}: {
  record: AreaRecord | null;
  areaId: string | null;
  lookup: Lookup;
  open: boolean;
  lowerSignal: number;
  onClose: () => void;
  onAbout: () => void;
}) {
  // optional in schema 1.0.0: an older file gets the error state, not a crash
  const [bikeValue, setBikeValue] = useState(DEFAULT_BIKE_VALUE);
  const broken = record && !(record.confidence && lookup.metadata.confidence_thresholds);
  // the standard advice needs no rating
  const advice = adviceFor(bikeValue, {
    limited_data: !broken && !!record?.limited_data,
    no_record: !broken && !!record?.no_record,
  });
  const note = broken ? STRINGS.advice.note.failed : advice.note;
  return (
    <AnswerCard
      open={open}
      area={record}
      areaId={areaId}
      state={broken ? "error" : record?.no_record ? "no-data" : "ready"}
      lowerSignal={lowerSignal}
      verdict={(explain) =>
        record && (
          <Verdict
            kind={kindOf(record)}
            confidence={record.confidence}
            reports={record.reports_12m}
            topShare={topShare(lookup.risk_bands)}
            onExplain={explain}
          />
        )
      }
      tier={record && !broken && <VerdictStrip kind={kindOf(record)} />}
      advice={(more) =>
        record && (
          <Advice
            advice={advice}
            note={note}
            bikeValue={bikeValue}
            onBikeValue={setBikeValue}
            onMore={more}
          />
        )
      }
      advicePanel={
        record
          ? {
              heading: <h2 className="m-0 headline-sm">{STRINGS.advice.sectionTitle}</h2>,
              body: <AdviceDetail advice={advice} note={note} />,
            }
          : undefined
      }
      details={
        record &&
        !broken && (
          <Details
            area={record}
            selectors={lookup.selectors}
            metadata={lookup.metadata}
            onAbout={onAbout}
          />
        )
      }
      explain={
        record &&
        !broken && (
          <Explain
            area={record}
            kind={kindOf(record)}
            bands={lookup.risk_bands}
            metadata={lookup.metadata}
          />
        )
      }
      onClose={onClose}
    />
  );
}
