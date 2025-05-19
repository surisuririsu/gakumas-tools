"use client";
import { createContext, useContext, useEffect, useState } from "react";
import DataContext from "@/contexts/DataContext";
import { fixCustomizations } from "@/utils/customizations";

const MemoryContext = createContext();

export function MemoryContextProvider({ children }) {
  const [saveState, setSaveState] = useState("unsaved");
  const [id, setId] = useState(null);
  const [name, setName] = useState(null);
  const [pIdolId, setPIdolId] = useState(null);
  const [params, setParams] = useState([null, null, null, null]);
  const [pItemIds, setPItemIds] = useState([0, 0, 0, 0]);
  const [skillCardIds, setSkillCardIds] = useState([0, 0, 0, 0, 0, 0]);
  const [customizations, setCustomizations] = useState([
    {},
    {},
    {},
    {},
    {},
    {},
  ]);
  const { fetchMemories } = useContext(DataContext);

  useEffect(() => {
    // If fewer than 4 pItems, pad with 0s
    if (pItemIds.length < 4) {
      setPItemIds((cur) => cur.concat(new Array(4 - cur.length).fill(0)));
    }
  }, [pItemIds]);

  useEffect(() => {
    setSaveState("unsaved");
  }, [name, pIdolId, params, pItemIds, skillCardIds]);

  async function save(asNew) {
    setSaveState("saving");
    const memory = {
      name,
      pIdolId,
      params,
      pItemIds,
      skillCardIds,
      customizations,
    };
    if (asNew || !id) {
      const result = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memories: [memory] }),
      });
      const data = await result.json();
      setId(data.id);
      setSaveState("saved");
    } else {
      await fetch(`/api/memory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memory),
      });
      setSaveState("saved");
    }
    fetchMemories();
  }

  async function setAll(memory) {
    setId(memory._id || null);
    setName(memory.name || null);
    setPIdolId(memory.pIdolId || null);
    setParams(memory.params || [null, null, null, null]);
    setPItemIds(memory.pItemIds || [0, 0, 0, 0]);
    setSkillCardIds(memory.skillCardIds || [0, 0, 0, 0, 0, 0]);
    if (memory.customizations) {
      setCustomizations(memory.customizations.map(fixCustomizations));
    } else {
      setCustomizations([{}, {}, {}, {}, {}, {}]);
    }
  }

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

  function replaceCustomizations(index, c11n) {
    setCustomizations((cur) => {
      const next = [...cur];
      next[index] = c11n;
      return next;
    });
  }

  return (
    <MemoryContext.Provider
      value={{
        saveState,
        id,
        name,
        setName,
        pIdolId,
        setPIdolId,
        params,
        setParams,
        pItemIds,
        skillCardIds,
        customizations,
        replacePItemId,
        replaceSkillCardId,
        replaceCustomizations,
        setAll,
        save,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export default MemoryContext;
