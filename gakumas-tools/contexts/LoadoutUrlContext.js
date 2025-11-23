"use client";
import { createContext, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Stages } from "gakumas-data";
import {
  loadoutFromSearchParams,
  loadoutsFromSearchParams,
  loadoutsToSearchParams,
  loadoutToSearchParams,
} from "@/utils/simulator";

const LoadoutUrlContext = createContext();

export function LoadoutUrlContextProvider({ children }) {
  const searchParams = useSearchParams();
  const loadoutFromUrl = useMemo(
    () => loadoutFromSearchParams(searchParams),
    []
  );
  const loadoutsFromUrl = useMemo(
    () => loadoutsFromSearchParams(searchParams),
    []
  );

  const updateUrl = (loadout, loadouts) => {
    const url = new URL(window.location);

    if (loadout.stageId === "custom") {
      window.history.replaceState(null, "", url.pathname);
      return;
    }

    const stage = Stages.getById(loadout.stageId);

    if (stage.type === "linkContest") {
      url.search = loadoutsToSearchParams(loadouts).toString();
    } else {
      url.search = loadoutToSearchParams(loadout).toString();
    }

    window.history.replaceState(null, "", url);
  };

  return (
    <LoadoutUrlContext.Provider
      value={{ loadoutFromUrl, loadoutsFromUrl, updateUrl }}
    >
      {children}
    </LoadoutUrlContext.Provider>
  );
}

export default LoadoutUrlContext;
