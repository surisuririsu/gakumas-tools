"use client";
import { createContext, useState } from "react";

const SearchContext = createContext();

export function SearchContextProvider({ children }) {
  const [pItemIds, setPItemIds] = useState([0, 0, 0]);
  const [skillCardIds, setSkillCardIds] = useState([0, 0, 0, 0, 0, 0]);

  function replacePItemId(index, itemId) {
    setPItemIds((cur) => {
      const next = [...cur];
      next[index] = itemId;
      return next;
    });
  }

  function replaceSkillCardId(index, cardId) {
    setSkillCardIds((cur) => {
      const next = [...cur];
      next[index] = cardId;
      return next;
    });
  }

  return (
    <SearchContext.Provider
      value={{
        pItemIds,
        skillCardIds,
        replacePItemId,
        replaceSkillCardId,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export default SearchContext;
