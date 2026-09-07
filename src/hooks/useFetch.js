import { useEffect, useState } from "react";
import { api } from "../api.js";

// Fetches a path whenever it changes and reports loading and error state.
// Returns a `reload` function for after a write.
export function useFetch(path, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: Boolean(enabled), error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e) => {
        if (e.name !== "AbortError") setState({ data: null, loading: false, error: e });
      });
    return () => controller.abort();
  }, [path, enabled, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
