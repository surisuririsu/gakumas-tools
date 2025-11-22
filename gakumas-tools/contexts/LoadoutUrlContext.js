"use client";
import { createContext, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Stages } from "gakumas-data";
import {
  loadoutFromSearchParams,
  loadoutToSearchParams,
} from "@/utils/simulator";

const LoadoutUrlContext = createContext();

export function LoadoutUrlContextProvider({ children }) {
  const searchParams = useSearchParams();
  const loadoutFromUrl = useMemo(
    () => loadoutFromSearchParams(searchParams),
    []
  );

  const updateUrl = (loadout) => {
    const url = new URL(window.location);

    if (loadout.stageId === "custom") {
      window.history.replaceState(null, "", url.pathname);
      return;
    }

    const stage = Stages.getById(loadout.stageId);

    if (stage.type === "linkContest") {
      if (url.searchParams.size) {
        window.history.replaceState(null, "", url.pathname);
      }
      return;
    }

    url.search = loadoutToSearchParams(loadout).toString();
    window.history.replaceState(null, "", url);
  };

  return (
    <LoadoutUrlContext.Provider value={{ loadoutFromUrl, updateUrl }}>
      {children}
    </LoadoutUrlContext.Provider>
  );
}

export default LoadoutUrlContext;
