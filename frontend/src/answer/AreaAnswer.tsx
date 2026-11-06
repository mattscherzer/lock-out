import type { AreaRecord, Fixture } from "../search/types.ts";
import { AnswerCard } from "./AnswerCard.tsx";
import { Details } from "./Details.tsx";
import { Explain } from "./Explain.tsx";
import { kindOf, topShare } from "./kind.ts";
import { Verdict, VerdictStrip } from "./Verdict.tsx";

export function AreaAnswer({
  record,
  areaId,
  fixture,
  open,
  lowerSignal,
  onClose,
  onAbout,
}: {
  record: AreaRecord | null;
  areaId: string | null;
  fixture: Fixture;
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
      state={record?.no_record ? "no-data" : "ready"}
      lowerSignal={lowerSignal}
      verdict={(explain) =>
        record && (
          <Verdict
            kind={kindOf(record)}
            reports={record.reports_12m}
            topShare={topShare(fixture.risk_bands)}
            onExplain={explain}
          />
        )
      }
      strip={record && <VerdictStrip kind={kindOf(record)} />}
      details={
        record && (
          <Details
            area={record}
            selectors={fixture.selectors}
            metadata={fixture.metadata}
            onAbout={onAbout}
          />
        )
      }
      explain={
        record && (
          <Explain
            area={record}
            kind={kindOf(record)}
            bands={fixture.risk_bands}
            metadata={fixture.metadata}
          />
        )
      }
      onClose={onClose}
    />
  );
}
