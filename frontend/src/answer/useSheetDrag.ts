import { type PointerEvent, type RefObject, useEffect, useEffectEvent, useRef } from "react";
import { phone } from "../viewport.ts";
import { CLOSED, settle, STOPS, stopOffsets, type Stop } from "./sheetStops.ts";

const SLOP_PX = 6; // movement below this is a tap, not a drag
const PULL_PX = 2; // a pull down from the top of the content claims the gesture this early, before the browser decides to scroll
const FLICK_MS = 150; // how far ahead the release velocity projects the sheet

type Args = {
  card: RefObject<HTMLElement | null>;
  stop: Stop;
  onStop: (stop: Stop) => void;
  onClose: () => void;
};

export function useSheetDrag({ card, stop, onStop, onClose }: Args) {
  const drag = useRef<{
    y: number;
    from: number;
    stops: number[];
    moved: boolean;
    last: [y: number, t: number] | null;
    v: number;
  } | null>(null);
  const begin = (y: number) => {
    const stops = stopOffsets(card.current!.offsetHeight);
    drag.current = { y, from: stops[STOPS.indexOf(stop)], stops, moved: false, last: null, v: 0 };
  };
  const track = (y: number, capture?: () => void) => {
    const d = drag.current;
    if (!d || !card.current) return;
    if (!d.moved) {
      if (Math.abs(y - d.y) < SLOP_PX) return;
      d.moved = true;
      capture?.();
      card.current.style.transition = "none";
    }
    const now = performance.now();
    if (!d.last || now - d.last[1] >= 8) {
      if (d.last) d.v = (y - d.last[0]) / (now - d.last[1]);
      d.last = [y, now];
    }
    const raw = d.from + y - d.y;
    card.current.style.transform = `translateY(${raw < 0 ? raw / 3 : raw}px)`;
  };
  const end = (y: number) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved || !card.current) return;
    const idle = d.last ? performance.now() - d.last[1] > 50 : true; // a held finger has no velocity
    const at = Math.max(0, d.from + y - d.y) + (idle ? 0 : d.v) * FLICK_MS;
    card.current.style.removeProperty("transition"); // the CSS transition settles it from here
    card.current.style.removeProperty("transform");
    const i = settle(d.stops, at);
    if (i === CLOSED) onClose();
    else onStop(STOPS[i]);
  };
  const cancel = () => {
    drag.current = null;
    card.current?.style.removeProperty("transition");
    card.current?.style.removeProperty("transform");
  };

  const pullStart = useEffectEvent((e: TouchEvent, el: HTMLElement) =>
    stop === "full" &&
    phone() &&
    el.scrollTop <= 0 &&
    e.touches.length === 1 &&
    !(e.target as Element).closest(".answer-pin")
      ? e.touches[0].clientY
      : null,
  );
  const touchBegin = useEffectEvent(begin);
  const touchTrack = useEffectEvent(track);
  const touchEnd = useEffectEvent(end);
  const touchCancel = useEffectEvent(cancel);
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    let pull: { y0: number; on: boolean } | null = null;
    const start = (e: TouchEvent) => {
      const y0 = pullStart(e, el);
      pull = y0 === null ? null : { y0, on: false };
    };
    const move = (e: TouchEvent) => {
      if (!pull) return;
      const y = e.touches[0].clientY;
      if (!pull.on) {
        if (y < pull.y0 || el.scrollTop > 0)
          pull = null; // scrolling up: the browser scrolls the content
        else if (y - pull.y0 >= PULL_PX) {
          pull.on = true;
          touchBegin(pull.y0);
        }
        if (!pull?.on) return;
      }
      e.preventDefault();
      touchTrack(y);
    };
    const finish = (e: TouchEvent) => {
      if (pull?.on) touchEnd(e.changedTouches[0].clientY);
      pull = null;
    };
    const abort = () => {
      if (pull?.on) touchCancel();
      pull = null;
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", finish);
    el.addEventListener("touchcancel", abort);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", finish);
      el.removeEventListener("touchcancel", abort);
    };
  }, []);

  return {
    onPointerDown: (e: PointerEvent) => {
      if (!phone()) return;
      if (stop === "full" && !(e.target as Element).closest(".answer-pin")) return;
      begin(e.clientY);
    },
    onPointerMove: (e: PointerEvent) =>
      track(e.clientY, () => (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)),
    onPointerUp: (e: PointerEvent) => end(e.clientY),
    onPointerCancel: cancel,
  };
}
