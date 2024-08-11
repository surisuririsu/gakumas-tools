"use client";
import { createContext, useEffect, useState } from "react";

const WORKSPACE_STORAGE_KEY = "gakumas-tools.workspace";

const WorkspaceContext = createContext();

export function WorkspaceContextProvider({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState(true);
  const [plan, setPlan] = useState("sense");
  const [idolId, setIdolId] = useState(1);

  useEffect(() => {
    const workspaceString = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (workspaceString) {
      const data = JSON.parse(workspaceString);
      if (data.filter) setFilter(data.filter);
      if (data.plan) setPlan(data.plan);
      if (data.idolId) setIdolId(data.idolId);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({ filter, plan, idolId })
    );
  }, [filter, plan, idolId]);

  return (
    <WorkspaceContext.Provider
      value={{
        filter,
        setFilter,
        plan,
        setPlan,
        idolId,
        setIdolId,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceContext;
