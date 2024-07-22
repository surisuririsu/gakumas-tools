import { createContext, useState } from "react";

const SelectionContext = createContext();

export function SelectionContextProvider({ children }) {
  const [selectedEntity, setSelectedEntity] = useState(null);

  return (
    <SelectionContext.Provider value={{ selectedEntity, setSelectedEntity }}>
      {children}
    </SelectionContext.Provider>
  );
}

export default SelectionContext;
