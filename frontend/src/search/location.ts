// Reading the device position and the permission state. Nothing here stores or sends the position.

export const LOCATE_TIMEOUT_MS = 10_000; // handed to the browser; it starts once permission is given
export const PROMPT_WAIT_MS = 30_000; // a prompt left unanswered never calls back in some browsers: stop waiting after this

export type Permission = "prompt" | "granted" | "denied";
export type LocateFailure = "denied" | "unavailable" | "timeout";
export type LatLon = { lat: number; lon: number };

export const PERMISSION_WAIT_MS = 1_000; // a permission read that never settles (some webviews) must not hold the row

// an insecure page has the API but is always refused, so the row would only mislead
export const hasGeolocation = () =>
  typeof navigator !== "undefined" && !!navigator.geolocation && window.isSecureContext !== false;

// null when the Permissions API is missing or throws (older Safari, some webviews): callers treat that as "prompt"
export async function queryPermission(): Promise<PermissionStatus | null> {
  try {
    const read = navigator.permissions?.query({ name: "geolocation" });
    const late = new Promise<null>((resolve) => setTimeout(resolve, PERMISSION_WAIT_MS, null));
    return (await Promise.race([read, late])) ?? null;
  } catch {
    return null;
  }
}

// GeolocationPositionError codes: 1 PERMISSION_DENIED, 2 POSITION_UNAVAILABLE, 3 TIMEOUT
const FAILURE: Record<number, LocateFailure> = { 1: "denied", 3: "timeout" };

/** One position fix (getCurrentPosition, never watchPosition). Rejects with a LocateFailure. */
export function getPosition(
  geo: Pick<Geolocation, "getCurrentPosition">,
  promptWaitMs = PROMPT_WAIT_MS,
): Promise<LatLon> {
  return new Promise((resolve, reject) => {
    const guard = setTimeout(() => reject("timeout" satisfies LocateFailure), promptWaitMs);
    const done = () => clearTimeout(guard);
    try {
      geo.getCurrentPosition(
        ({ coords }) => {
          done();
          resolve({ lat: coords.latitude, lon: coords.longitude });
        },
        ({ code }) => {
          done();
          reject(FAILURE[code] ?? ("unavailable" satisfies LocateFailure));
        },
        { timeout: LOCATE_TIMEOUT_MS, maximumAge: 0 },
      );
    } catch {
      done(); // some browsers throw in an insecure context instead of calling back
      reject("unavailable" satisfies LocateFailure);
    }
  });
}
