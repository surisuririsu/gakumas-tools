import { createContext, useRef } from "react";
import { useSession } from "next-auth/react";

const DataContext = createContext();

export function DataContextProvider({ children }) {
  const { status } = useSession();
  const memories = useRef(null);

  async function getMemories() {
    if (status == "authenticated" && !memories.current) {
      const response = await fetch("/api/memory");
      const data = await response.json();
      memories.current = data.memories;
    }
    return memories.current;
  }

  return (
    <DataContext.Provider value={{ getMemories }}>
      {children}
    </DataContext.Provider>
  );
}

export default DataContext;
