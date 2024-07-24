import { createContext, useEffect, useState } from "react";

const WORKSPACE_STORAGE_KEY = "gakumas-tools.workspace";

const WorkspaceContext = createContext();

export function WorkspaceContextProvider({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [showProduceRankCalculator, setShowProduceRankCalculator] =
    useState(false);
  const [showDex, setShowDex] = useState(false);
  const [showMemoryEditor, setShowMemoryEditor] = useState(false);
  const [showMemories, setShowMemories] = useState(false);

  useEffect(() => {
    const workspaceString = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (workspaceString) {
      const data = JSON.parse(workspaceString);
      setShowProduceRankCalculator(!!data.showProduceRankCalculator);
      setShowDex(!!data.showDex);
      setShowMemoryEditor(!!data.showMemoryEditor);
      setShowMemories(!!data.showMemories);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        showProduceRankCalculator,
        showDex,
        showMemoryEditor,
        showMemories,
      })
    );
  }, [showProduceRankCalculator, showDex, showMemoryEditor, showMemories]);

  return (
    <WorkspaceContext.Provider
      value={{
        showProduceRankCalculator,
        setShowProduceRankCalculator,
        showDex,
        setShowDex,
        showMemoryEditor,
        setShowMemoryEditor,
        showMemories,
        setShowMemories,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceContext;
