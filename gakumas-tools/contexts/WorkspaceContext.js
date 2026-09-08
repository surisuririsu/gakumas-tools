"use client";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_WORKSPACE,
  parseWorkspace,
  WORKSPACE_STORAGE_KEY,
  writeWorkspaceCookie,
} from "@/utils/workspace";

const WorkspaceContext = createContext();

// initialWorkspace comes from the request cookie, so the server renders the
// same workspace the client hydrates with. It is null for visitors who have no
// cookie yet, which is what triggers the one-time localStorage migration.
export function WorkspaceContextProvider({ initialWorkspace, children }) {
  const initial = initialWorkspace || DEFAULT_WORKSPACE;
  const [filter, setFilter] = useState(initial.filter);
  const [plan, setPlan] = useState(initial.plan);
  const [idolId, setIdolId] = useState(initial.idolId);
  const [pinnedTools, setPinnedTools] = useState(initial.pinnedTools);

  useEffect(() => {
    if (initialWorkspace) return;

    let stored;
    try {
      stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    } catch {
      // localStorage unavailable (e.g. privacy mode) — nothing to migrate.
      return;
    }
    if (!stored) return;

    const workspace = parseWorkspace(stored);
    setFilter(workspace.filter);
    setPlan(workspace.plan);
    setIdolId(workspace.idolId);
    setPinnedTools(workspace.pinnedTools);
  }, []);

  const persisted = useRef(false);
  useEffect(() => {
    // Skip the first run: state still matches what the server rendered.
    if (!persisted.current) {
      persisted.current = true;
      return;
    }
    writeWorkspaceCookie({ filter, plan, idolId, pinnedTools });
  }, [filter, plan, idolId, pinnedTools]);

  const pin = useCallback((tool) => {
    setPinnedTools((cur) => [...cur, tool]);
  }, []);

  const unpin = useCallback((tool) => {
    setPinnedTools((cur) => cur.filter((t) => t != tool));
  }, []);

  const value = useMemo(
    () => ({
      filter,
      setFilter,
      plan,
      setPlan,
      idolId,
      setIdolId,
      pinnedTools,
      pin,
      unpin,
    }),
    [filter, plan, idolId, pinnedTools, pin, unpin]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceContext;
