import { createContext, useState } from "react";

const EntityContext = createContext();

export function EntityContextProvider({ children }) {
  const [selectedEntity, setSelectedEntity] = useState(null);

  return (
    <EntityContext.Provider value={{ selectedEntity, setSelectedEntity }}>
      {children}
    </EntityContext.Provider>
  );
}

export default EntityContext;
