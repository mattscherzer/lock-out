import { useEffect, useRef, useState } from "react";
import { getPosition, hasGeolocation, queryPermission, type Permission } from "./location.ts";

export type LocateView = "ready" | "wait" | "denied" | "fail";
type Status = "idle" | "waiting" | "noArea" | "failed";

type Options = {
  open: boolean; // the search list; the permission is read when it opens
  find?: (lat: number, lon: number) => string | null; // the area id at a position
  onFound: (id: string) => void;
};

/** The "Use my location" row: permission, one tap = one position, and the five outcomes. */
export function useLocate({ open, find, onFound }: Options) {
  const supported = !!find && hasGeolocation();
  const [permission, setPermission] = useState<Permission>("prompt");
  const [refused, setRefused] = useState(false); // the tap was refused: denied for the session
  const [status, setStatus] = useState<Status>("idle");
  const [helpOpen, setHelpOpen] = useState(false);
  const request = useRef(0); // a newer tap, or typing, makes an older answer stale

  // read when the list opens, kept current with the change event while it is open
  useEffect(() => {
    if (!open || !supported) return;
    let stale = false;
    let watched: PermissionStatus | null = null;
    const onChange = () => {
      if (!watched) return;
      setPermission(watched.state);
      setRefused(false);
    };
    void queryPermission().then((s) => {
      if (stale) return;
      watched = s;
      setPermission(s?.state ?? "prompt");
      if (s && s.state !== "denied") setRefused(false); // the setting changed while the list was closed
      s?.addEventListener("change", onChange);
    });
    return () => {
      stale = true;
      watched?.removeEventListener("change", onChange);
    };
  }, [open, supported]);

  // opening or closing the list drops an old message and the help; a search in flight carries on
  useEffect(() => {
    setStatus((s) => (s === "waiting" ? s : "idle"));
    setHelpOpen(false);
  }, [open]);

  const denied = permission === "denied" || refused;

  const locate = () => {
    if (!find || denied || status === "waiting") return; // denied: the browser would not ask again, so do not call it
    const id = ++request.current;
    const fresh = () => id === request.current;
    setStatus("waiting");
    getPosition(navigator.geolocation).then(
      ({ lat, lon }) => {
        if (!fresh()) return;
        const area = find(lat, lon);
        setStatus(area ? "idle" : "noArea");
        if (area) onFound(area);
      },
      async (failure) => {
        if (!fresh()) return;
        const read = (await queryPermission())?.state ?? null; // a dismissed prompt can arrive as a refusal
        if (!fresh()) return;
        if (read) setPermission(read);
        const dismissed = failure === "denied" && read === "prompt"; // some browsers report a dismissed prompt as a refusal
        const blocked =
          !dismissed && (read === "denied" || (failure === "denied" && read === null));
        if (blocked && failure === "denied") setRefused(true);
        setStatus(blocked ? "idle" : "failed");
      },
    );
  };

  /** Typing, picking, clearing or closing by hand: drop the pending answer and the message. */
  const reset = () => {
    request.current++;
    setStatus("idle");
    setHelpOpen(false);
  };

  const view: LocateView = denied
    ? "denied"
    : status === "waiting"
      ? "wait"
      : status === "failed"
        ? "fail"
        : "ready";

  return {
    supported,
    view,
    noArea: status === "noArea",
    helpOpen: denied && helpOpen,
    locate,
    toggleHelp: () => setHelpOpen((h) => !h),
    reset,
  };
}
