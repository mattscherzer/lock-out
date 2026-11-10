import { useEffect, useRef, useState } from "react";
import { LOADING_DELAY_MS } from "./places.ts";

export function useStreets(loadStreets?: () => Promise<unknown>) {
  const inFlight = useRef<Promise<void>>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [slow, setSlow] = useState(false); // loading has lasted past LOADING_DELAY_MS
  const [, setLoaded] = useState(0); // bumped when street data arrives: addStreets fills index in place, so rerender to search again

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setSlow(true), LOADING_DELAY_MS);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [loading]);

  const load = () => {
    if (!loadStreets || inFlight.current) return;
    setLoading(true);
    setError(false);
    inFlight.current = loadStreets().then(
      () => {
        setLoading(false);
        setLoaded((n) => n + 1);
      },
      () => {
        setLoading(false);
        setError(true);
        inFlight.current = undefined;
      },
    );
  };

  return { loading, error, slow, load };
}
