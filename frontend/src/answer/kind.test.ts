import { expect, it } from "vitest";
import { kindOf, tierOf, topShare } from "./kind.ts";
import { bands, rec } from "./testData.ts";

it("maps the lookup; no record is no-data, thin data is limited, never low", () => {
  expect(tierOf(rec({ tier: "HIGH" }))).toBe("high");
  expect(kindOf(rec({ no_record: true, limited_data: true }))).toBe("no-data");
  expect(kindOf(rec({ limited_data: true }))).toBe("limited");
  expect(kindOf(rec())).toBe("low");
  expect(topShare(bands)).toBe(15);
});
