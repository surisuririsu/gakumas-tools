import { createContext, useCallback, useEffect, useState } from "react";

const WorkspaceContext = createContext();

export function WorkspaceContextProvider({ children }) {
  const [showProduceRankCalculator, setShowProduceRankCalculator] =
    useState(false);
  const [showMemoryEditor, setShowMemoryEditor] = useState(false);

  return (
    <WorkspaceContext.Provider
      value={{
        showProduceRankCalculator,
        setShowProduceRankCalculator,
        showMemoryEditor,
        setShowMemoryEditor,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceContext;
