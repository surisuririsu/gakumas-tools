import { createContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const WorkspaceContext = createContext();

export function WorkspaceContextProvider({ children }) {
  const { status } = useSession();
  const [showProduceRankCalculator, setShowProduceRankCalculator] =
    useState(false);
  const [showDex, setShowDex] = useState(false);
  const [showMemoryEditor, setShowMemoryEditor] = useState(false);
  const [showMemories, setShowMemories] = useState(false);

  useEffect(() => {
    if (status == "authenticated") {
      async function fetchData() {
        const response = await fetch("/api/workspace");
        const data = await response.json();
        setShowProduceRankCalculator(!!data.showProduceRankCalculator);
        setShowDex(!!data.showDex);
        setShowMemoryEditor(!!data.showMemoryEditor);
        setShowMemories(!!data.showMemories);
      }
      fetchData();
    }
  }, [status]);

  useEffect(() => {
    if (status == "authenticated") {
      async function fetchData() {
        const response = await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            showProduceRankCalculator,
            showDex,
            showMemoryEditor,
            showMemories,
          }),
        });
      }
      fetchData();
    }
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
