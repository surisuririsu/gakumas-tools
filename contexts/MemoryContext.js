import { createContext, useContext, useEffect, useState } from "react";
import DataContext from "@/contexts/DataContext";

const MemoryContext = createContext();

export function MemoryContextProvider({ children }) {
  const [saveState, setSaveState] = useState("unsaved");
  const [id, setId] = useState(null);
  const [name, setName] = useState(null);
  const [pIdolId, setPIdolId] = useState(null);
  const [params, setParams] = useState([null, null, null, null]);
  const [pItemIds, setPItemIds] = useState([0, 0, 0]);
  const [skillCardIds, setSkillCardIds] = useState([0, 0, 0, 0, 0, 0]);
  const { fetchMemories } = useContext(DataContext);

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
        saveState,
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
