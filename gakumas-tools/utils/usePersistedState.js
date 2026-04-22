import { useEffect, useRef, useState } from "react";

export default function usePersistedState(key, initial) {
  const [state, setState] = useState(initial);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setState(JSON.parse(raw));
    } catch {}
  }, [key]);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState];
}
