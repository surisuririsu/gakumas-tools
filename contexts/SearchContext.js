import { createContext, useState } from "react";

const SearchContext = createContext();

export function SearchContextProvider({ children }) {
  const [pItemIds, setPItemIds] = useState([0, 0, 0]);
  const [skillCardIds, setSkillCardIds] = useState([0, 0, 0, 0, 0, 0]);

  return (
    <SearchContext.Provider
      value={{
        pItemIds,
        setPItemIds,
        skillCardIds,
        setSkillCardIds,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export default SearchContext;
