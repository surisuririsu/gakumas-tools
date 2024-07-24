import { createContext, useEffect, useState } from "react";

const WORKSPACE_STORAGE_KEY = "gakumas-tools.workspace";

const WorkspaceContext = createContext();

export function WorkspaceContextProvider({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [openWidgets, setOpenWidgets] = useState({});

  useEffect(() => {
    const workspaceString = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (workspaceString) {
      const data = JSON.parse(workspaceString);
      if (data.openWidgets) setOpenWidgets(data.openWidgets);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({ openWidgets })
    );
  }, [openWidgets]);

  function open(widget) {
    setOpenWidgets({ ...openWidgets, [widget]: true });
  }

  function close(widget) {
    setOpenWidgets({ ...openWidgets, [widget]: false });
  }

  function toggle(widget) {
    setOpenWidgets({ ...openWidgets, [widget]: !openWidgets[widget] });
  }

  return (
    <WorkspaceContext.Provider
      value={{
        openWidgets,
        open,
        close,
        toggle,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceContext;
