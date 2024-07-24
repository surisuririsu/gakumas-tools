import { createContext, useState } from "react";

const MemoryContext = createContext();

export function MemoryContextProvider({ children }) {
  const [id, setId] = useState(null);
  const [name, setName] = useState(null);
  const [pIdolId, setPIdolId] = useState(null);
  const [params, setParams] = useState([null, null, null, null]);
  const [pItemIds, setPItemIds] = useState([0, 0, 0]);
  const [skillCardIds, setSkillCardIds] = useState([0, 0, 0, 0, 0, 0]);

  async function save(asNew) {
    const memory = {
      name,
      pIdolId,
      params,
      pItemIds,
      skillCardIds,
    };
    if (asNew || !id) {
      const result = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memory),
      });
      setId(result.id);
    } else {
      const result = await fetch(`/api/memory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memory),
      });
    }
  }

  async function setAll(memory) {
    setId(memory._id);
    setName(memory.name);
    setPIdolId(memory.pIdolId);
    setParams(memory.params);
    setPItemIds(memory.pItemIds);
    setSkillCardIds(memory.skillCardIds);
  }

  return (
    <MemoryContext.Provider
      value={{
        id,
        setId,
        name,
        setName,
        pIdolId,
        setPIdolId,
        params,
        setParams,
        pItemIds,
        setPItemIds,
        skillCardIds,
        setSkillCardIds,
        setAll,
        save,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export default MemoryContext;
