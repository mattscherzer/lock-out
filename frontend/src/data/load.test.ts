import { afterEach, expect, it, vi } from "vitest";
import { loadAppData } from "./load.ts";

afterEach(() => vi.unstubAllGlobals());

const lookup = (over = {}) => ({
  metadata: { attribution: { police: "p", osm: "o", lor: "l" } },
  areas: { a1: {} },
  ...over,
});
const geojson = (...ids: string[]) => ({
  type: "FeatureCollection",
  features: ids.map((id) => ({ type: "Feature", geometry: null, properties: { id } })),
});
const serve = (files: Record<string, unknown>) =>
  vi.stubGlobal("fetch", (url: string) => {
    const name = url.split("/").pop()!;
    return Promise.resolve(
      name in files
        ? { ok: true, json: () => Promise.resolve(files[name]) }
        : { ok: false, status: 404 },
    );
  });

it("returns files that agree with each other", async () => {
  serve({ "lookup_schema_v1.json": lookup(), "areas.geojson": geojson("a1") });
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect((await loadAppData()).gazetteer).toBeNull();
});

it("rejects a geojson id the lookup does not know", async () => {
  serve({ "lookup_schema_v1.json": lookup(), "areas.geojson": geojson("a1", "zz") });
  await expect(loadAppData()).rejects.toThrow("feature zz has no record");
});

it("rejects a lookup without attribution", async () => {
  serve({ "lookup_schema_v1.json": lookup({ metadata: {} }), "areas.geojson": geojson("a1") });
  await expect(loadAppData()).rejects.toThrow("metadata.attribution");
});
