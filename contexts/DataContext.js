import { createContext, useState } from "react";
import { useSession } from "next-auth/react";

const DataContext = createContext();

export function DataContextProvider({ children }) {
  const { status } = useSession();
  const [memories, setMemories] = useState([]);

  async function fetchMemories() {
    if (status == "authenticated") {
      const response = await fetch("/api/memory");
      const data = await response.json();
      setMemories(data.memories);
    }
  }

  return (
    <DataContext.Provider value={{ memories, fetchMemories }}>
      {children}
    </DataContext.Provider>
  );
}

export default DataContext;
