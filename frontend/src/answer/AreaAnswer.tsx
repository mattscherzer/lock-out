import type { AreaRecord, Lookup } from "../search/types.ts";
import { AnswerCard } from "./AnswerCard.tsx";
import { Details } from "./Details.tsx";
import { Explain } from "./Explain.tsx";
import { kindOf, topShare } from "./kind.ts";
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
  return (
    <AnswerCard
      open={open}
      area={record}
      areaId={areaId}
      state={record && !record.confidence ? "error" : record?.no_record ? "no-data" : "ready"}
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
      tier={record && <VerdictStrip kind={kindOf(record)} />}
      details={
        record && (
          <Details
            area={record}
            selectors={lookup.selectors}
            metadata={lookup.metadata}
            onAbout={onAbout}
          />
        )
      }
      explain={
        record && (
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
