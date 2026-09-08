"use client";
import { createContext, useCallback, useMemo, useState } from "react";

const SearchContext = createContext();

export function SearchContextProvider({ children }) {
  const [pItemIds, setPItemIds] = useState([0, 0, 0]);
  const [skillCardIds, setSkillCardIds] = useState([0, 0, 0, 0, 0, 0]);

  const replacePItemId = useCallback((index, itemId) => {
    setPItemIds((cur) => {
      const next = [...cur];
      next[index] = itemId;
      return next;
    });
  }, []);

  const replaceSkillCardId = useCallback((index, cardId) => {
    setSkillCardIds((cur) => {
      const next = [...cur];
      next[index] = cardId;
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ pItemIds, skillCardIds, replacePItemId, replaceSkillCardId }),
    [pItemIds, skillCardIds, replacePItemId, replaceSkillCardId]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export default SearchContext;
