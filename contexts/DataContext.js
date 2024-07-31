import { createContext, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const DataContext = createContext();

export function DataContextProvider({ children }) {
  const { status } = useSession();
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);

  async function fetchMemories() {
    if (status == "authenticated" && !memoriesLoading) {
      setMemoriesLoading(true);
      const response = await fetch("/api/memory");
      const data = await response.json();
      setMemories(data.memories);
      setMemoriesLoading(false);
    }
  }

  return (
    <DataContext.Provider value={{ memories, fetchMemories, memoriesLoading }}>
      {children}
    </DataContext.Provider>
  );
}

export default DataContext;
