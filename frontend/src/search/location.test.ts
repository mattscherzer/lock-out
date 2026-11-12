import { afterEach, expect, it, vi } from "vitest";
import { getPosition, hasGeolocation, LOCATE_TIMEOUT_MS, queryPermission } from "./location.ts";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const geo = (answer: "ok" | 1 | 2 | 3 | "throw" | "silent") => ({
  getCurrentPosition: vi.fn(
    (ok: PositionCallback, fail: PositionErrorCallback, _options?: PositionOptions) => {
      if (answer === "throw") throw new Error("insecure context");
      if (answer === "ok")
        ok({ coords: { latitude: 52.5, longitude: 13.4 } } as GeolocationPosition);
      else if (answer !== "silent") fail({ code: answer } as GeolocationPositionError);
    },
  ),
});

it("resolves the position as lat and lon, asking once with the timeout", async () => {
  const g = geo("ok");
  await expect(getPosition(g)).resolves.toEqual({ lat: 52.5, lon: 13.4 });
  expect(g.getCurrentPosition).toHaveBeenCalledOnce();
  expect(g.getCurrentPosition.mock.calls[0][2]).toMatchObject({ timeout: LOCATE_TIMEOUT_MS });
  expect(LOCATE_TIMEOUT_MS).toBe(10_000);
});

it.each([
  [1, "denied"],
  [2, "unavailable"],
  [3, "timeout"],
  ["throw", "unavailable"],
] as const)("rejects error %s as %s", async (answer, failure) => {
  await expect(getPosition(geo(answer))).rejects.toBe(failure);
});

it("stops waiting for a prompt nobody answers", async () => {
  vi.useFakeTimers();
  const result = expect(getPosition(geo("silent"), 500)).rejects.toBe("timeout");
  await vi.advanceTimersByTimeAsync(500);
  await result;
});

it("reads the permission, and gives null when the Permissions API is missing or throws", async () => {
  const status = { state: "granted" };
  vi.stubGlobal("navigator", { permissions: { query: vi.fn().mockResolvedValue(status) } });
  await expect(queryPermission()).resolves.toBe(status);
  vi.stubGlobal("navigator", {
    permissions: { query: vi.fn().mockRejectedValue(new TypeError()) },
  });
  await expect(queryPermission()).resolves.toBeNull();
  vi.stubGlobal("navigator", {});
  await expect(queryPermission()).resolves.toBeNull();
});

it("detects the Geolocation API", () => {
  vi.stubGlobal("navigator", {});
  expect(hasGeolocation()).toBe(false);
  vi.stubGlobal("navigator", { geolocation: geo("ok") });
  expect(hasGeolocation()).toBe(true);
});
