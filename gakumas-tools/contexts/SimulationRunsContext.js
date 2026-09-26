"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { LoadoutActionsContext } from "@/contexts/LoadoutContext";
import LoadoutUrlContext from "@/contexts/LoadoutUrlContext";
import {
  deriveRunMeta,
  extractLoadoutFields,
  loadHistoryFromStorage,
  MAX_HISTORY,
  newRunId,
  normalizeSavedRun,
  saveHistoryToStorage,
  summarizeScores,
} from "@/utils/simulationRun";

const SimulationRunsContext = createContext();

export function SimulationRunsContextProvider({ children }) {
  const { status } = useSession();
  const { loadoutFromUrl, loadoutsFromUrl } = useContext(LoadoutUrlContext);
  const { setLoadout, setLoadouts } = useContext(LoadoutActionsContext);

  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState([]);
  const [savedRuns, setSavedRuns] = useState([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState(false);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const runs = loadHistoryFromStorage();
    setHistory(runs);

    const urlHasData =
      loadoutFromUrl?.hasDataFromParams || loadoutsFromUrl?.length;
    if (!urlHasData && runs.length) {
      const first = runs[0];
      setLoadout(first.loadout);
      if (first.linkLoadouts?.length) {
        setLoadouts(first.linkLoadouts);
      }
    }

    setLoaded(true);
  }, [loadoutFromUrl, loadoutsFromUrl, setLoadout, setLoadouts]);

  useEffect(() => {
    if (!loaded) return;
    saveHistoryToStorage(history);
  }, [history, loaded]);

  const fetchSaved = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setSavedLoading(true);
    try {
      const res = await fetch("/api/loadout");
      if (!res.ok) {
        throw new Error(`GET /api/loadout failed with ${res.status}`);
      }
      const list = await res.json();
      setSavedRuns(list.map(normalizeSavedRun).filter(Boolean));
      setSavedError(false);
    } catch (err) {
      console.error(err);
      setSavedError(true);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  const mutateSaved = useCallback(
    async (method, body) => {
      try {
        const res = await fetch("/api/loadout", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error(`${method} /api/loadout failed with ${res.status}`);
        }
        return res;
      } finally {
        await fetchSaved({ quiet: true });
      }
    },
    [fetchSaved],
  );

  useEffect(() => {
    if (status === "authenticated") {
      fetchSaved();
    } else if (status === "unauthenticated") {
      setSavedRuns([]);
      setSavedLoading(false);
    }
  }, [status, fetchSaved]);

  const pushRun = useCallback(({ loadout, loadouts, scores }) => {
    const base = extractLoadoutFields(loadout);
    const linkLoadouts = Array.isArray(loadouts)
      ? loadouts.map(extractLoadoutFields)
      : null;
    const stats = scores ? summarizeScores(scores) : null;
    const run = {
      id: newRunId(),
      createdAt: new Date().toISOString(),
      loadout: base,
      linkLoadouts,
      stats,
      derived: deriveRunMeta(base),
    };
    setHistory((cur) => {
      const prev = cur[0];
      if (prev && JSON.stringify(prev.loadout) === JSON.stringify(base)) {
        return [run, ...cur.slice(1)];
      }
      return [run, ...cur].slice(0, MAX_HISTORY);
    });
    return run;
  }, []);

  const deleteHistoryRun = useCallback((id) => {
    setHistory((cur) => cur.filter((r) => r.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const saveRun = useCallback(
    async (run, name) => {
      const body = {
        name,
        ...run.loadout,
        linkLoadouts: run.linkLoadouts,
        stats: run.stats,
        derived: run.derived,
      };
      const res = await mutateSaved("POST", body);
      const data = await res.json();
      return data.id;
    },
    [mutateSaved],
  );

  const deleteSaved = useCallback(
    async (ids) => {
      const idSet = new Set(ids);
      setSavedRuns((cur) => cur.filter((r) => !idSet.has(r._id || r.id)));
      await mutateSaved("DELETE", { ids });
    },
    [mutateSaved],
  );

  const renameSaved = useCallback(
    async (id, name) => {
      setSavedRuns((cur) =>
        cur.map((r) => ((r._id || r.id) === id ? { ...r, name } : r)),
      );
      await mutateSaved("PATCH", { id, name });
    },
    [mutateSaved],
  );

  const loadRun = useCallback(
    (run) => {
      setLoadout(run.loadout);
      if (run.linkLoadouts?.length) {
        setLoadouts(run.linkLoadouts);
      }
    },
    [setLoadout, setLoadouts],
  );

  const value = useMemo(
    () => ({
      history,
      savedRuns,
      savedLoading,
      savedError,
      pushRun,
      deleteHistoryRun,
      clearHistory,
      saveRun,
      deleteSaved,
      renameSaved,
      loadRun,
      refetchSaved: fetchSaved,
    }),
    [
      history,
      savedRuns,
      savedLoading,
      savedError,
      pushRun,
      deleteHistoryRun,
      clearHistory,
      saveRun,
      deleteSaved,
      renameSaved,
      loadRun,
      fetchSaved,
    ],
  );

  return (
    <SimulationRunsContext.Provider value={value}>
      {children}
    </SimulationRunsContext.Provider>
  );
}

export default SimulationRunsContext;
