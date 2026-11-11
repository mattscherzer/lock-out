import { useEffect, useRef, useState } from "react";
import { LOADING_DELAY_MS } from "./places.ts";

export function useStreets(loadStreets?: () => Promise<unknown>) {
  const inFlight = useRef<Promise<void>>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [slow, setSlow] = useState(false); // loading has lasted past LOADING_DELAY_MS

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
      () => setLoading(false),
      () => {
        setLoading(false);
        setError(true);
        inFlight.current = undefined;
      },
    );
  };

  return { loading, error, slow, load };
}
