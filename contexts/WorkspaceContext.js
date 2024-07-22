import { createContext, useState } from "react";

const WorkspaceContext = createContext();

export function WorkspaceContextProvider({ children }) {
  const [showProduceRankCalculator, setShowProduceRankCalculator] =
    useState(false);
  const [showMemoryEditor, setShowMemoryEditor] = useState(true);
  const [showDex, setShowDex] = useState(true);

  return (
    <WorkspaceContext.Provider
      value={{
        showProduceRankCalculator,
        setShowProduceRankCalculator,
        showMemoryEditor,
        setShowMemoryEditor,
        showDex,
        setShowDex,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceContext;
