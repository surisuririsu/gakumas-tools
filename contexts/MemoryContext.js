import { createContext, useState } from "react";

const MemoryContext = createContext();

export function MemoryContextProvider({ children }) {
  const [pIdolId, setPIdolId] = useState(null);

  return (
    <MemoryContext.Provider value={{ pIdolId, setPIdolId }}>
      {children}
    </MemoryContext.Provider>
  );
}

export default MemoryContext;
