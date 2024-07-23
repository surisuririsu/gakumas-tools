import { createContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const WorkspaceContext = createContext();

export function WorkspaceContextProvider({ children }) {
  const { status } = useSession();
  const [showProduceRankCalculator, setShowProduceRankCalculator] =
    useState(false);
  const [showMemoryEditor, setShowMemoryEditor] = useState(false);
  const [showDex, setShowDex] = useState(false);

  useEffect(() => {
    if (status == "authenticated") {
      async function fetchData() {
        const response = await fetch("/api/workspace");
        const data = await response.json();
        setShowProduceRankCalculator(!!data.showProduceRankCalculator);
        setShowMemoryEditor(!!data.showMemoryEditor);
        setShowDex(!!data.showDex);
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
            showMemoryEditor,
            showDex,
          }),
        });
      }
      fetchData();
    }
  }, [showProduceRankCalculator, showMemoryEditor, showDex]);

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
