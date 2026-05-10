"use client";
import { createContext, useCallback, useRef } from "react";

const NavigationGuardContext = createContext({
  setGuard: () => {},
  runGuard: async () => true,
});

export function NavigationGuardProvider({ children }) {
  const guardRef = useRef(null);

  const setGuard = useCallback((fn) => {
    guardRef.current = fn;
  }, []);

  const runGuard = useCallback(async () => {
    if (!guardRef.current) return true;
    return await guardRef.current();
  }, []);

  return (
    <NavigationGuardContext.Provider value={{ setGuard, runGuard }}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export default NavigationGuardContext;
