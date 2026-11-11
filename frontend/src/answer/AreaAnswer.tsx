import { useState, type Ref } from "react";
import type { AreaRecord, Lookup } from "../domain/lookup.ts";
import { adviceFor, DEFAULT_BIKE_VALUE } from "../advice/advice.ts";
import { STRINGS } from "../strings.ts";
import { Advice } from "./Advice.tsx";
import { AdviceDetail } from "./AdviceDetail.tsx";
import { AnswerCard, type AnswerCardHandle } from "./AnswerCard.tsx";
import { Details } from "./Details.tsx";
import { Explain } from "./Explain.tsx";
import { kindOf, topShare } from "../domain/kind.ts";
import { Verdict, VerdictStrip } from "./Verdict.tsx";

export function AreaAnswer({
  ref,
  record,
  areaId,
  lookup,
  open,
  onClose,
  onAbout,
}: {
  ref?: Ref<AnswerCardHandle>;
  record: AreaRecord | null;
  areaId: string | null;
  lookup: Lookup;
  open: boolean;
  onClose: () => void;
  onAbout: () => void;
}) {
  const [bikeValue, setBikeValue] = useState(DEFAULT_BIKE_VALUE);
  // optional in schema 1.0.0: an older file gets the error state, not a crash
  const confidence = record?.confidence;
  const thresholds = lookup.metadata.confidence_thresholds;
  const metadata = thresholds && { ...lookup.metadata, confidence_thresholds: thresholds };
  const broken = record && !(confidence && metadata);
  // the standard advice needs no rating
  const advice = adviceFor(bikeValue, {
    limited_data: !broken && !!record?.limited_data,
    no_record: !broken && !!record?.no_record,
  });
  const note = broken ? STRINGS.advice.note.failed : advice.note;
  return (
    <AnswerCard
      ref={ref}
      open={open}
      area={record}
      areaId={areaId}
      state={broken ? "error" : record?.no_record ? "no-data" : "ready"}
      verdict={(explain) =>
        record &&
        confidence && (
          <Verdict
            kind={kindOf(record)}
            confidence={confidence}
            reports={record.reports_12m}
            topShare={topShare(lookup.risk_bands)}
            onExplain={explain}
          />
        )
      }
      strip={record && !broken && <VerdictStrip kind={kindOf(record)} />}
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
        metadata &&
        confidence && (
          <Details
            area={record}
            selectors={lookup.selectors}
            metadata={metadata}
            onAbout={onAbout}
          />
        )
      }
      explain={
        record &&
        metadata &&
        confidence && (
          <Explain
            area={record}
            kind={kindOf(record)}
            bands={lookup.risk_bands}
            metadata={metadata}
          />
        )
      }
      onClose={onClose}
    />
  );
}
