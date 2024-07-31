import { createContext, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const DataContext = createContext();

export function DataContextProvider({ children }) {
  const { status } = useSession();
  const [memories, setMemories] = useState([]);
  const memoryFetchInFlight = useRef(false);

  async function fetchMemories() {
    if (status == "authenticated" && !memoryFetchInFlight.current) {
      memoryFetchInFlight.current = true;
      const response = await fetch("/api/memory");
      const data = await response.json();
      setMemories(data.memories);
      memoryFetchInFlight.current = false;
    }
  }

  return (
    <DataContext.Provider value={{ memories, fetchMemories }}>
      {children}
    </DataContext.Provider>
  );
}

export default DataContext;
