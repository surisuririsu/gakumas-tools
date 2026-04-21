"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import LoadoutContext from "@/contexts/LoadoutContext";
import LoadoutUrlContext from "@/contexts/LoadoutUrlContext";
import {
  deriveRunMeta,
  normalizeSavedRun,
  summarizeScores,
} from "@/utils/simulationRun";

const HISTORY_KEY = "gakumas-tools.simulation-runs.history";
const LEGACY_LOADOUT_HISTORY_KEY = "gakumas-tools.loadout-history";
const LEGACY_LOADOUTS_HISTORY_KEY = "gakumas-tools.loadouts-history";
export const MAX_HISTORY = 20;

const SimulationRunsContext = createContext();

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function extractLoadoutFields(loadout) {
  const {
    stageId,
    customStage,
    supportBonus,
    params,
    pItemIds,
    skillCardIdGroups,
    customizationGroups,
  } = loadout;
  return {
    stageId,
    customStage,
    supportBonus,
    params,
    pItemIds,
    skillCardIdGroups,
    customizationGroups,
  };
}

function legacyEntryToRun(entry) {
  if (!entry || !entry.skillCardIdGroups) return null;
  const loadout = extractLoadoutFields(entry);
  const linkLoadouts = Array.isArray(entry.loadouts)
    ? entry.loadouts.map(extractLoadoutFields)
    : null;
  return {
    id: newId(),
    createdAt: null,
    loadout,
    linkLoadouts,
    stats: null,
    derived: deriveRunMeta(loadout),
  };
}

function migrateLegacyHistory() {
  const runs = [];
  try {
    const s1 = localStorage.getItem(LEGACY_LOADOUT_HISTORY_KEY);
    if (s1) {
      const arr = JSON.parse(s1);
      if (Array.isArray(arr)) {
        for (const entry of arr) {
          const run = legacyEntryToRun(entry);
          if (run) runs.push(run);
        }
      }
    }
  } catch {}
  try {
    const s2 = localStorage.getItem(LEGACY_LOADOUTS_HISTORY_KEY);
    if (s2) {
      const arr = JSON.parse(s2);
      if (Array.isArray(arr)) {
        for (const loadouts of arr) {
          if (!Array.isArray(loadouts) || !loadouts.length) continue;
          const run = legacyEntryToRun({
            ...loadouts[0],
            loadouts,
          });
          if (run) runs.push(run);
        }
      }
    }
  } catch {}
  return runs.slice(0, MAX_HISTORY);
}

export function SimulationRunsContextProvider({ children }) {
  const { status } = useSession();
  const { loadoutFromUrl, loadoutsFromUrl } = useContext(LoadoutUrlContext);
  const { setLoadout, setLoadouts } = useContext(LoadoutContext);

  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState([]);
  const [savedRuns, setSavedRuns] = useState([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const didInitRef = useRef(false);

  // Load/migrate history from localStorage once on mount.
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    let runs = [];
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) runs = parsed;
      }
    } catch {}

    if (!runs.length) {
      runs = migrateLegacyHistory();
      if (runs.length) {
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(runs));
          localStorage.removeItem(LEGACY_LOADOUT_HISTORY_KEY);
          localStorage.removeItem(LEGACY_LOADOUTS_HISTORY_KEY);
        } catch {}
      }
    }

    setHistory(runs);

    // Restore most recent run into the editor unless URL provides a loadout.
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

  // Persist history on change.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {}
  }, [history, loaded]);

  const fetchSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const res = await fetch("/api/loadout");
      if (!res.ok) {
        setSavedRuns([]);
        return;
      }
      const list = await res.json();
      setSavedRuns(list.map(normalizeSavedRun).filter(Boolean));
    } catch {
      setSavedRuns([]);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSaved();
    } else if (status === "unauthenticated") {
      setSavedRuns([]);
      setSavedLoading(false);
    }
  }, [status, fetchSaved]);

  const pushRun = useCallback(
    ({ loadout, loadouts, scores }) => {
      const base = extractLoadoutFields(loadout);
      const linkLoadouts = Array.isArray(loadouts)
        ? loadouts.map(extractLoadoutFields)
        : null;
      const run = {
        id: newId(),
        createdAt: new Date().toISOString(),
        loadout: base,
        linkLoadouts,
        stats: scores ? summarizeScores(scores) : null,
        derived: deriveRunMeta(base),
      };
      setHistory((cur) => [run, ...cur].slice(0, MAX_HISTORY));
      return run;
    },
    [],
  );

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
      const res = await fetch("/api/loadout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      await fetchSaved();
      return data.id;
    },
    [fetchSaved],
  );

  const deleteSaved = useCallback(
    async (ids) => {
      await fetch("/api/loadout", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      await fetchSaved();
    },
    [fetchSaved],
  );

  const renameSaved = useCallback(
    async (id, name) => {
      await fetch("/api/loadout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      await fetchSaved();
    },
    [fetchSaved],
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

  return (
    <SimulationRunsContext.Provider
      value={{
        history,
        savedRuns,
        savedLoading,
        pushRun,
        deleteHistoryRun,
        clearHistory,
        saveRun,
        deleteSaved,
        renameSaved,
        loadRun,
        refetchSaved: fetchSaved,
      }}
    >
      {children}
    </SimulationRunsContext.Provider>
  );
}

export default SimulationRunsContext;
