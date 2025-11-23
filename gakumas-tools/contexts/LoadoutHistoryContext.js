"use client";
import { createContext, useContext, useEffect, useState } from "react";
import LoadoutContext from "@/contexts/LoadoutContext";
import LoadoutUrlContext from "@/contexts/LoadoutUrlContext";

const LOADOUT_HISTORY_STORAGE_KEY = "gakumas-tools.loadout-history";
const LOADOUTS_HISTORY_STORAGE_KEY = "gakumas-tools.loadouts-history";

const LoadoutHistoryContext = createContext();

export function LoadoutHistoryContextProvider({ children }) {
  const { loadoutFromUrl, loadoutsFromUrl } = useContext(LoadoutUrlContext);
  const { loadout, loadouts, setLoadout, setLoadouts } =
    useContext(LoadoutContext);
  const [loaded, setLoaded] = useState(false);
  const [loadoutHistory, setLoadoutHistory] = useState([]);
  const [loadoutsHistory, setLoadoutsHistory] = useState([]);

  useEffect(() => {
    const loadoutHistoryString = localStorage.getItem(
      LOADOUT_HISTORY_STORAGE_KEY
    );
    if (loadoutHistoryString) {
      const data = JSON.parse(loadoutHistoryString);
      setLoadoutHistory(data);

      if (loadoutFromUrl.hasDataFromParams || loadoutsFromUrl.length) {
        setLoaded(true);
        return;
      }

      setLoadout(data[0]);
      if (data[0].loadouts) {
        setLoadouts(data[0].loadouts);
        localStorage.removeItem(LOADOUTS_HISTORY_STORAGE_KEY);
        setLoaded(true);
        return;
      }
    }

    const loadoutsHistoryString = localStorage.getItem(
      LOADOUTS_HISTORY_STORAGE_KEY
    );
    if (loadoutsHistoryString) {
      const data = JSON.parse(loadoutsHistoryString);
      setLoadoutsHistory(data);

      if (loadoutFromUrl.hasDataFromParams || loadoutsFromUrl.length) {
        setLoaded(true);
        return;
      }

      setLoadouts(data[0]);
      if (data[0][0]) {
        setLoadout(data[0][0]);
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      LOADOUT_HISTORY_STORAGE_KEY,
      JSON.stringify(loadoutHistory)
    );
  }, [loadoutHistory]);

  const pushLoadoutHistory = () => {
    if (JSON.stringify(loadout) == JSON.stringify(loadoutHistory[0])) return;
    setLoadoutHistory((cur) => [loadout, ...cur].slice(0, 10));
  };

  const pushLoadoutsHistory = () => {
    if (JSON.stringify(loadouts) == JSON.stringify(loadoutHistory[0].loadouts))
      return;
    setLoadoutHistory((cur) =>
      [
        {
          ...loadouts[0],
          loadouts,
        },
        ...cur,
      ].slice(0, 10)
    );
  };

  return (
    <LoadoutHistoryContext.Provider
      value={{
        loadoutHistory,
        pushLoadoutHistory,
        pushLoadoutsHistory,
      }}
    >
      {children}
    </LoadoutHistoryContext.Provider>
  );
}

export default LoadoutHistoryContext;
